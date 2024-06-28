import mongoose, { Document, Schema } from 'mongoose';

interface IUser extends Document {
  address: string;
  tokens: {
    symbol: string;
    contractAddress: string;
    amount: string;
    amountInWei: string;
  }[];
}

const userSchema: Schema<IUser> = new Schema({
  address: { type: String, required: true, unique: true },
  tokens: [
    {
      symbol: { type: String, required: true },
      contractAddress: { type: String, required: true },
      amount: { type: String, required: true },
      amountInWei: { type: String, required: true }
    }
  ]
});

export default mongoose.model<IUser>('User', userSchema);
