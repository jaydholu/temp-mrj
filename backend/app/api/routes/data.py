from fastapi import APIRouter, UploadFile, HTTPException, status, Depends, File, Query
from fastapi.responses import StreamingResponse
from typing import Literal
from io import BytesIO
from datetime import datetime, timezone

from app.core.database import db
from app.core.dependencies import get_current_active_user
from app.utils.file_handlers import JSONHandler, CSVHandler


router = APIRouter(tags=["Data Import/Export"])


@router.post("/import")
async def import_books(
    file: UploadFile = File(...),
    format_type: Literal["json", "csv"] = Query(..., description="File format"),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Import books from JSON or CSV file.
    Duplicate detection is based on matching title + author (case-insensitive).
    Duplicates already in the library are skipped, not re-imported.
    """

    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid filename"
        )

    file_ext = file.filename.rsplit('.', 1)[-1].lower()

    if format_type == "json" and file_ext != "json":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File extension must be .json for JSON format"
        )

    if format_type == "csv" and file_ext != "csv":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File extension must be .csv for CSV format"
        )

    try:
        # Parse file — pass db and user_id for deduplication
        if format_type == "json":
            valid_books, errors = await JSONHandler.parse_import(
                file, user_id=current_user["_id"], db=db
            )
        else:
            valid_books, errors = await CSVHandler.parse_import(
                file, user_id=current_user["_id"], db=db
            )

        # Add user_id and timestamps to valid books
        books_to_insert = []
        for book in valid_books:
            book["user_id"] = current_user["_id"]
            book["created_at"] = datetime.now(timezone.utc)
            book["updated_at"] = datetime.now(timezone.utc)
            books_to_insert.append(book)

        imported_count = 0
        if books_to_insert:
            result = await db.books.insert_many(books_to_insert)
            imported_count = len(result.inserted_ids)

        # Separate duplicate errors from real errors for clearer messaging
        duplicate_errors = [e for e in errors if "Duplicate" in e.get("error", "")]
        real_errors = [e for e in errors if "Duplicate" not in e.get("error", "")]

        return {
            "message": "Import completed",
            "stats": {
                "total": len(valid_books) + len(errors),
                "imported": imported_count,
                "skipped_duplicates": len(duplicate_errors),
                "failed": len(real_errors),
                "errors": (real_errors + duplicate_errors)[:10]  # Return first 10
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Import failed: {str(e)}"
        )
    finally:
        await file.close()


@router.get("/export/json")
async def export_books_json(
    include_favorites_only: bool = Query(False),
    current_user: dict = Depends(get_current_active_user)
):
    """Export all books as JSON file"""

    query = {"user_id": current_user["_id"]}
    if include_favorites_only:
        query["is_favorite"] = True

    cursor = db.books.find(query).sort([("reading_started", -1)])
    books = await cursor.to_list(length=None)
    username = current_user["user_name"]
    print(f"Exporting {len(books)} books for user {username} (favorites only: {include_favorites_only})")

    if not books:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No books found to export"
        )

    serialized_books = []
    for book in books:
        serialized_books.append({
            "id": str(book["_id"]),
            "title": book["title"],
            "author": book.get("author"),
            "isbn": book.get("isbn"),
            "genre": book.get("genre"),
            "rating": book.get("rating", 0.0),
            "description": book.get("description"),
            "cover_image": book.get("cover_image"),
            "reading_started": book["reading_started"],
            "reading_finished": book.get("reading_finished"),
            "is_favorite": book.get("is_favorite", False),
            "page_count": book.get("page_count"),
            "publisher": book.get("publisher"),
            "publication_year": book.get("publication_year"),
            "language": book.get("language", "English"),
            "format": book.get("format"),
            "created_at": book["created_at"],
            "updated_at": book["updated_at"]
        })

    json_content = JSONHandler.generate_export(serialized_books)
    buffer = BytesIO(json_content.encode('utf-8'))
    filename = f"{username}_books_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

    return StreamingResponse(
        buffer,
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/export/csv")
async def export_books_csv(
    include_favorites_only: bool = Query(False),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Export all books as CSV file.
    Includes cover_image URL, full ISO datetime strings for all date fields.
    """

    query = {"user_id": current_user["_id"]}
    if include_favorites_only:
        query["is_favorite"] = True

    cursor = db.books.find(query).sort([("reading_started", -1)])
    books = await cursor.to_list(length=None)

    if not books:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No books found to export"
        )

    serialized_books = []
    for book in books:
        serialized_books.append({
            "id": str(book["_id"]),
            "title": book["title"],
            "author": book.get("author"),
            "isbn": book.get("isbn"),
            "genre": book.get("genre"),
            "rating": book.get("rating", 0.0),
            "description": book.get("description"),
            "cover_image": book.get("cover_image"),
            "reading_started": book["reading_started"],
            "reading_finished": book.get("reading_finished"),
            "is_favorite": book.get("is_favorite", False),
            "page_count": book.get("page_count"),
            "publisher": book.get("publisher"),
            "publication_year": book.get("publication_year"),
            "language": book.get("language", "English"),
            "format": book.get("format"),
            "created_at": book["created_at"],
            "updated_at": book["updated_at"]
        })

    csv_content = CSVHandler.generate_export(serialized_books)
    buffer = BytesIO(csv_content.encode('utf-8-sig'))  # BOM for Excel compatibility
    filename = f"books_backup_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

    return StreamingResponse(
        buffer,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/template/csv")
async def download_csv_template():
    """Download a CSV template for bulk import"""

    sample_books = [
        {
            "title": "The Great Gatsby",
            "author": "F. Scott Fitzgerald",
            "isbn": "9780743273565",
            "genre": "Classic",
            "rating": 4.5,
            "description": "A classic American novel",
            "cover_image": "",
            "reading_started": datetime(2025, 1, 1, tzinfo=timezone.utc),
            "reading_finished": datetime(2025, 1, 15, tzinfo=timezone.utc),
            "is_favorite": True,
            "page_count": 180,
            "publisher": "Scribner",
            "publication_year": 1925,
            "language": "English",
            "format": "paperback",
            "created_at": datetime(2025, 1, 1, tzinfo=timezone.utc),
            "updated_at": datetime(2025, 1, 15, tzinfo=timezone.utc),
        },
        {
            "title": "1984",
            "author": "George Orwell",
            "isbn": "9780451524935",
            "genre": "Dystopian",
            "rating": 5.0,
            "description": "A dystopian social science fiction novel",
            "cover_image": "",
            "reading_started": datetime(2025, 1, 20, tzinfo=timezone.utc),
            "reading_finished": None,
            "is_favorite": False,
            "page_count": 328,
            "publisher": "Secker & Warburg",
            "publication_year": 1949,
            "language": "English",
            "format": "ebook",
            "created_at": datetime(2025, 1, 20, tzinfo=timezone.utc),
            "updated_at": datetime(2025, 1, 20, tzinfo=timezone.utc),
        }
    ]

    csv_content = CSVHandler.generate_export(sample_books)
    buffer = BytesIO(csv_content.encode('utf-8-sig'))

    return StreamingResponse(
        buffer,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=books_import_template.csv"}
    )
