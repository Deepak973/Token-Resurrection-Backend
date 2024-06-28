import mongoose, { Document, Schema, Model } from 'mongoose';

// Define an interface representing a document in MongoDB
interface IMerkleTree extends Document {
  token: string;
  contractAddress: string;
  merkleRoot: string;
  tokenTotal: string;
  tokenTotalInWei: string;
  claims: Map<string, any>;  // Adjust the type of claims map according to your data structure
}

// Create a Schema corresponding to the document interface
const merkleTreeSchema: Schema<IMerkleTree> = new Schema({
  token: { type: String, required: true },
  contractAddress: { type: String, required: true },
  merkleRoot: { type: String, required: true },
  tokenTotal: { type: String, required: true },
  tokenTotalInWei: { type: String, required: true },
  claims: { type: Map, of: Schema.Types.Mixed, required: true },  // Adjust as necessary for the structure of claims
});

// Create a Model
const MerkleTree: Model<IMerkleTree> = mongoose.model<IMerkleTree>('MerkleTree', merkleTreeSchema);

export default MerkleTree;
