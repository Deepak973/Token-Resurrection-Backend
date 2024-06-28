import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
    from: string;
    amount: string;
    txHash: string[];
    token: string;
    to: string;
}

const transactionSchema = new Schema({
    from: { type: String, required: true },
    amount: { type: String, required: true },
    txHash: { type: [String], required: true },
    token: { type: String, required: true },
    to: { type: String, required: true },
});

export default mongoose.model<ITransaction>('Transaction', transactionSchema);
