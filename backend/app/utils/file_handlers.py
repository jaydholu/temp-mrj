import csv
import json
from io import StringIO
from datetime import datetime, timezone
from typing import List, Dict, Tuple
from fastapi import UploadFile, HTTPException, status


class FileHandler:
    """Base class for file handling"""
    
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
    
    @staticmethod
    async def validate_file_size(file: UploadFile) -> bool:
        """Validate file size"""
        contents = await file.read()
        file_size = len(contents)
        await file.seek(0)  # Reset file pointer
        
        if file_size > FileHandler.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File too large. Maximum size is {FileHandler.MAX_FILE_SIZE / (1024*1024)}MB"
            )
        
        return True


class JSONHandler(FileHandler):
    """Handle JSON file operations"""
    
    @staticmethod
    async def parse_import(file: UploadFile) -> Tuple[List[Dict], List[Dict]]:
        """
        Parse JSON file for import
        Returns: (valid_books, errors)
        """
        await JSONHandler.validate_file_size(file)
        
        try:
            contents = await file.read()
            data = json.loads(contents.decode('utf-8'))
            
            if not isinstance(data, list):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="JSON file must contain an array of books"
                )
            
            valid_books = []
            errors = []
            
            for idx, entry in enumerate(data, start=1):
                try:
                    book = JSONHandler._validate_book_entry(entry, idx)
                    valid_books.append(book)
                except ValueError as e:
                    errors.append({
                        "row": idx,
                        "error": str(e),
                        "data": entry.get("title", "Unknown")
                    })
            
            return valid_books, errors
            
        except json.JSONDecodeError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid JSON format: {str(e)}"
            )
        except UnicodeDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File encoding error. Please use UTF-8 encoding"
            )
    
    @staticmethod
    def _validate_book_entry(entry: Dict, row_num: int) -> Dict:
        """Validate and normalize a book entry"""
        
        # Required field
        if not entry.get("title"):
            raise ValueError(f"Missing required field: title")
        
        # Normalize dates
        reading_started = entry.get("reading_started")
        reading_finished = entry.get("reading_finished")
        
        if reading_started:
            try:
                if isinstance(reading_started, str):
                    reading_started = datetime.fromisoformat(reading_started.replace('Z', '+00:00'))
            except (ValueError, TypeError):
                raise ValueError(f"Invalid date format for reading_started")
        else:
            # Default to today if not provided
            reading_started = datetime.now(timezone.utc)
        
        if reading_finished:
            try:
                if isinstance(reading_finished, str):
                    reading_finished = datetime.fromisoformat(reading_finished.replace('Z', '+00:00'))
            except (ValueError, TypeError):
                raise ValueError(f"Invalid date format for reading_finished")
        
        # Validate date range
        if reading_finished and reading_started and reading_finished < reading_started:
            raise ValueError("Finish date cannot be before start date")
        
        # Validate rating
        rating = entry.get("rating", 0.0)
        try:
            rating = float(rating) if rating else 0.0
            if rating < 0 or rating > 5:
                raise ValueError("Rating must be between 0 and 5")
        except (ValueError, TypeError):
            rating = 0.0
        
        # Validate page count
        page_count = entry.get("page_count")
        if page_count:
            try:
                page_count = int(page_count)
                if page_count <= 0:
                    page_count = None
            except (ValueError, TypeError):
                page_count = None
        
        # Validate publication year
        publication_year = entry.get("publication_year")
        if publication_year:
            try:
                publication_year = int(publication_year)
                current_year = datetime.now().year
                if publication_year < 1000 or publication_year > current_year:
                    publication_year = None
            except (ValueError, TypeError):
                publication_year = None
        
        # Validate format
        valid_formats = ['paperback', 'hardcover', 'ebook', 'audiobook']
        book_format = entry.get("format")
        if book_format and book_format.lower() not in valid_formats:
            book_format = None
        
        return {
            "title": entry["title"].strip(),
            "author": entry.get("author", "").strip() if entry.get("author") else None,
            "isbn": entry.get("isbn", "").strip() if entry.get("isbn") else None,
            "genre": entry.get("genre", "").strip() if entry.get("genre") else None,
            "rating": rating,
            "description": entry.get("description", "").strip() if entry.get("description") else None,
            "cover_image": entry.get("cover_image", "").strip() if entry.get("cover_image") else None,
            "reading_started": reading_started,
            "reading_finished": reading_finished,
            "is_favorite": bool(entry.get("is_favorite", False)),
            "page_count": page_count,
            "publisher": entry.get("publisher", "").strip() if entry.get("publisher") else None,
            "publication_year": publication_year,
            "language": entry.get("language", "English").strip(),
            "format": book_format.lower() if book_format else None
        }
    
    @staticmethod
    def generate_export(books: List[Dict]) -> str:
        """Generate JSON export string"""
        
        export_data = []
        
        for book in books:
            export_book = {
                "id": book.get("id"),
                "title": book.get("title"),
                "author": book.get("author"),
                "isbn": book.get("isbn"),
                "genre": book.get("genre"),
                "rating": book.get("rating", 0.0),
                "description": book.get("description"),
                "cover_image": book.get("cover_image"),
                "reading_started": book.get("reading_started").isoformat() if book.get("reading_started") else None,
                "reading_finished": book.get("reading_finished").isoformat() if book.get("reading_finished") else None,
                "is_favorite": book.get("is_favorite", False),
                "page_count": book.get("page_count"),
                "publisher": book.get("publisher"),
                "publication_year": book.get("publication_year"),
                "language": book.get("language", "English"),
                "format": book.get("format"),
                "created_at": book.get("created_at").isoformat() if book.get("created_at") else None,
                "updated_at": book.get("updated_at").isoformat() if book.get("updated_at") else None
            }
            export_data.append(export_book)
        
        return json.dumps(export_data, indent=2, ensure_ascii=False)


class CSVHandler(FileHandler):
    """Handle CSV file operations"""
    
    CSV_HEADERS = [
        "title", "author", "isbn", "genre", "rating", "description",
        "reading_started", "reading_finished", "is_favorite",
        "page_count", "publisher", "publication_year", "language", "format"
    ]
    
    @staticmethod
    async def parse_import(file: UploadFile) -> Tuple[List[Dict], List[Dict]]:
        """
        Parse CSV file for import
        Returns: (valid_books, errors)
        """
        await CSVHandler.validate_file_size(file)
        
        try:
            contents = await file.read()
            decoded_content = contents.decode('utf-8-sig')  # Handle BOM
            
            csv_reader = csv.DictReader(StringIO(decoded_content))
            
            # Validate headers
            if not csv_reader.fieldnames:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="CSV file is empty or has no headers"
                )
            
            valid_books = []
            errors = []
            
            for idx, row in enumerate(csv_reader, start=2):  # Start at 2 (header is row 1)
                try:
                    book = CSVHandler._validate_csv_row(row, idx)
                    valid_books.append(book)
                except ValueError as e:
                    errors.append({
                        "row": idx,
                        "error": str(e),
                        "data": row.get("title", "Unknown")
                    })
            
            return valid_books, errors
            
        except UnicodeDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File encoding error. Please use UTF-8 encoding"
            )
        except csv.Error as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid CSV format: {str(e)}"
            )
    
    @staticmethod
    def _validate_csv_row(row: Dict, row_num: int) -> Dict:
        """Validate and normalize a CSV row"""
        
        # Required field
        title = row.get("title", "").strip()
        if not title:
            raise ValueError("Missing required field: title")
        
        # Parse dates
        reading_started = row.get("reading_started", "").strip()
        reading_finished = row.get("reading_finished", "").strip()
        
        if reading_started:
            try:
                reading_started = datetime.fromisoformat(reading_started.replace('Z', '+00:00'))
            except ValueError:
                try:
                    # Try other common formats
                    reading_started = datetime.strptime(reading_started, "%Y-%m-%d")
                except ValueError:
                    raise ValueError(f"Invalid date format for reading_started: {reading_started}")
        else:
            reading_started = datetime.now(timezone.utc)
        
        if reading_finished:
            try:
                reading_finished = datetime.fromisoformat(reading_finished.replace('Z', '+00:00'))
            except ValueError:
                try:
                    reading_finished = datetime.strptime(reading_finished, "%Y-%m-%d")
                except ValueError:
                    raise ValueError(f"Invalid date format for reading_finished: {reading_finished}")
        else:
            reading_finished = None
        
        # Validate dates
        if reading_finished and reading_finished < reading_started:
            raise ValueError("Finish date cannot be before start date")
        
        # Parse rating
        rating_str = row.get("rating", "0").strip()
        try:
            rating = float(rating_str) if rating_str else 0.0
            if rating < 0 or rating > 5:
                rating = 0.0
        except ValueError:
            rating = 0.0
        
        # Parse is_favorite
        is_favorite_str = row.get("is_favorite", "").strip().lower()
        is_favorite = is_favorite_str in ['true', '1', 'yes', 'y']
        
        # Parse page_count
        page_count = row.get("page_count", "").strip()
        if page_count:
            try:
                page_count = int(page_count)
                if page_count <= 0:
                    page_count = None
            except ValueError:
                page_count = None
        else:
            page_count = None
        
        # Parse publication_year
        publication_year = row.get("publication_year", "").strip()
        if publication_year:
            try:
                publication_year = int(publication_year)
                current_year = datetime.now().year
                if publication_year < 1000 or publication_year > current_year:
                    publication_year = None
            except ValueError:
                publication_year = None
        else:
            publication_year = None
        
        # Validate format
        valid_formats = ['paperback', 'hardcover', 'ebook', 'audiobook']
        book_format = row.get("format", "").strip().lower()
        if book_format and book_format not in valid_formats:
            book_format = None
        
        return {
            "title": title,
            "author": row.get("author", "").strip() or None,
            "isbn": row.get("isbn", "").strip() or None,
            "genre": row.get("genre", "").strip() or None,
            "rating": rating,
            "description": row.get("description", "").strip() or None,
            "cover_image": None,  # CSV doesn't include images
            "reading_started": reading_started,
            "reading_finished": reading_finished,
            "is_favorite": is_favorite,
            "page_count": page_count,
            "publisher": row.get("publisher", "").strip() or None,
            "publication_year": publication_year,
            "language": row.get("language", "English").strip(),
            "format": book_format or None
        }
    
    @staticmethod
    def generate_export(books: List[Dict]) -> str:
        """Generate CSV export string"""
        
        output = StringIO()
        writer = csv.DictWriter(output, fieldnames=CSVHandler.CSV_HEADERS)
        
        writer.writeheader()
        
        for book in books:
            row = {
                "title": book.get("title", ""),
                "author": book.get("author", ""),
                "isbn": book.get("isbn", ""),
                "genre": book.get("genre", ""),
                "rating": book.get("rating", 0.0),
                "description": book.get("description", ""),
                "reading_started": book.get("reading_started").strftime("%Y-%m-%d") if book.get("reading_started") else "",
                "reading_finished": book.get("reading_finished").strftime("%Y-%m-%d") if book.get("reading_finished") else "",
                "is_favorite": str(book.get("is_favorite", False)).lower(),
                "page_count": book.get("page_count", ""),
                "publisher": book.get("publisher", ""),
                "publication_year": book.get("publication_year", ""),
                "language": book.get("language", "English"),
                "format": book.get("format", "")
            }
            writer.writerow(row)
        
        return output.getvalue()
    