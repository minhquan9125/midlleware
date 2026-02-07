import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const removeOldCollections = async () => {
    try {
        const MONGO_URI = process.env.MONGO_URI;
        await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        
        const db = mongoose.connection.db;
        
        // Delete old collection without underscores
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(col => col.name);
        
        if (collectionNames.includes('healthcheckschedules')) {
            await db.dropCollection('healthcheckschedules');
            console.log('✅ Deleted: healthcheckschedules');
        }
        
        // Show final collections
        const finalCollections = await db.listCollections().toArray();
        console.log('\n✅ Final health check collections:');
        finalCollections
            .filter(col => col.name.includes('health') || col.name.includes('employee') || col.name.includes('appointment'))
            .forEach(col => console.log(`   - ${col.name}`));
        
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

removeOldCollections();