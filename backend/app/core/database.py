from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure
import logging
from app.core.config import settings


logger = logging.getLogger(__name__)


class Database:
    """MongoDB database manager"""
    
    client: AsyncIOMotorClient = None
    
    def __init__(self):
        self.client = None
        self._db = None
    
    async def connect(self):
        """Connect to MongoDB"""
        try:
            self.client = AsyncIOMotorClient(
                settings.MONGODB_URI.get_secret_value(),
                serverSelectionTimeoutMS=5000
            )
            
            # Test connection
            await self.client.admin.command('ping')
            
            self._db = self.client[settings.MONGODB_DBNAME.get_secret_value()]
            
            # Create indexes
            await self._create_indexes()
            
            logger.info("✅ Connected to MongoDB")
            
        except ConnectionFailure as e:
            logger.error(f"❌ MongoDB connection failed: {e}")
            raise e
        except Exception as e:
            logger.error(f"❌ Database initialization error: {e}")
            raise e
    
    async def _create_indexes(self):
        """Create database indexes"""
        try:
            # Users collection indexes
            await self._db.users.create_index("email", unique=True)
            await self._db.users.create_index("user_name", unique=True)  # Changed from userid
            
            # Books collection indexes
            await self._db.books.create_index("user_id")
            await self._db.books.create_index([("user_id", 1), ("is_favorite", 1)])
            await self._db.books.create_index([("user_id", 1), ("reading_started", -1)])
            await self._db.books.create_index([("user_id", 1), ("title", 1)])
            
            logger.info("✅ Database indexes created")
            
        except Exception as e:
            logger.warning(f"⚠️ Index creation warning: {e}")
    
    async def close(self):
        """Close database connection"""
        if self.client:
            self.client.close()
            logger.info("🔌 MongoDB connection closed")

    @property
    def db(self):
        if self._db is None:
            raise RuntimeError("Database not connected. Call connect() first.")
        return self._db
    
    @property
    def users(self):
        """Users collection"""
        return self._db.users
    
    @property
    def books(self):
        """Books collection"""
        return self._db.books


# Global database instance
db = Database()
