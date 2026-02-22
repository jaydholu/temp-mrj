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
    Import books from JSON or CSV file
    
    **Supported formats:**
    - JSON: Array of book objects
    - CSV: Comma-separated values with headers
    
    **Required fields:**
    - title
    - reading_started (defaults to current date if not provided)
    
    **Optional fields:**
    - author, isbn, genre, rating, description
    - reading_finished, is_favorite
    - page_count, publisher, publication_year, language, format
    """
    
    # Validate file extension
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
        # Parse file based on format
        if format_type == "json":
            valid_books, errors = await JSONHandler.parse_import(file)
        else:  # csv
            valid_books, errors = await CSVHandler.parse_import(file)
        
        # Add user_id and timestamps to valid books
        books_to_insert = []
        for book in valid_books:
            book["user_id"] = current_user["_id"]
            book["created_at"] = datetime.now(timezone.utc)
            book["updated_at"] = datetime.now(timezone.utc)
            books_to_insert.append(book)
        
        # Insert books
        imported_count = 0
        if books_to_insert:
            result = await db.books.insert_many(books_to_insert)
            imported_count = len(result.inserted_ids)
        
        return {
            "message": "Import completed",
            "stats": {
                "total": len(valid_books) + len(errors),
                "imported": imported_count,
                "failed": len(errors),
                "errors": errors[:10]  # Return first 10 errors
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
    """
    Export all books as JSON file
    
    **Query Parameters:**
    - include_favorites_only: Export only favorite books
    """
    
    # Build query
    query = {"user_id": current_user["_id"]}
    if include_favorites_only:
        query["is_favorite"] = True
    
    # Fetch books
    cursor = db.books.find(query).sort([("reading_started", -1)])
    books = await cursor.to_list(length=None)
    
    if not books:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No books found to export"
        )
    
    # Serialize books
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
    
    # Generate JSON
    json_content = JSONHandler.generate_export(serialized_books)
    
    # Create response
    buffer = BytesIO(json_content.encode('utf-8'))
    
    filename = f"books_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    
    return StreamingResponse(
        buffer,
        media_type="application/json",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


@router.get("/export/csv")
async def export_books_csv(
    include_favorites_only: bool = Query(False),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Export all books as CSV file
    
    **Query Parameters:**
    - include_favorites_only: Export only favorite books
    
    **Note:** CSV export does not include cover images
    """
    
    # Build query
    query = {"user_id": current_user["_id"]}
    if include_favorites_only:
        query["is_favorite"] = True
    
    # Fetch books
    cursor = db.books.find(query).sort([("reading_started", -1)])
    books = await cursor.to_list(length=None)
    
    if not books:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No books found to export"
        )
    
    # Serialize books
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
    
    # Generate CSV
    csv_content = CSVHandler.generate_export(serialized_books)
    
    # Create response
    buffer = BytesIO(csv_content.encode('utf-8-sig'))  # BOM for Excel compatibility
    
    filename = f"books_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return StreamingResponse(
        buffer,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


@router.get("/template/csv")
async def download_csv_template():
    """
    Download a CSV template for bulk import
    
    Returns a sample CSV file with proper headers and example data
    """
    
    sample_books = [
        {
            "title": "The Great Gatsby",
            "author": "F. Scott Fitzgerald",
            "isbn": "9780743273565",
            "genre": "Classic",
            "rating": 4.5,
            "description": "A classic American novel",
            "reading_started": datetime(2025, 1, 1),
            "reading_finished": datetime(2025, 1, 15),
            "is_favorite": True,
            "page_count": 180,
            "publisher": "Scribner",
            "publication_year": 1925,
            "language": "English",
            "format": "paperback"
        },
        {
            "title": "1984",
            "author": "George Orwell",
            "isbn": "9780451524935",
            "genre": "Dystopian",
            "rating": 5.0,
            "description": "A dystopian social science fiction novel",
            "reading_started": datetime(2025, 1, 20),
            "reading_finished": None,
            "is_favorite": False,
            "page_count": 328,
            "publisher": "Secker & Warburg",
            "publication_year": 1949,
            "language": "English",
            "format": "ebook"
        }
    ]
    
    csv_content = CSVHandler.generate_export(sample_books)
    buffer = BytesIO(csv_content.encode('utf-8-sig'))
    
    return StreamingResponse(
        buffer,
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=books_import_template.csv"
        }
    )