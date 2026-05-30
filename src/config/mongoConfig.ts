import mongoose from "mongoose"

mongoose.Promise = Promise;

const mongoServer = async (): Promise<void> => {
    try {
        if (mongoose.connection.readyState === 1) {
            console.log("Mongodb is Alreay Connected");
            return ;
        } 

        const uri =
            process.env.MONGO_URI || "mongodb://127.0.0.1:27017/qr-menu";
        await mongoose.connect(uri);
        console.log("Mongodb is connected successfully");
    } catch (error) {
        console.error('MongoDB Connection Error:', error);
        process.exit(1);
    }
}

export default mongoServer;