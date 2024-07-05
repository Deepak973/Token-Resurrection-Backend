import mongoose, { Document, Schema, Model } from 'mongoose';

interface IProposal extends Document {
  tokenName: string;
  tokenAddress: string;
  contractAddress: string;
  merkelRoot: string;
  ResolverAddress: string;
  schemUid: string;
  status: 'active' | 'approved' | 'rejected';
  addresses: string[];
  totalAmount: string;
  totalAccount: string;
}

const proposalSchema: Schema<IProposal> = new Schema({
  tokenName: { type: String, required: true },
  tokenAddress: { type: String, required: true },
  contractAddress: { type: String, required: true },
  merkelRoot: { type: String, required: true },
  ResolverAddress: { type: String, required: true },
  schemUid: { type: String, required: true },
  status: {
    type: String,
    enum: ['active', 'approved', 'rejected'],
    default: 'active',
  },
  addresses: { type: [String], required: true },
  totalAmount: { type: String, required: true },
  totalAccount: { type: String, required: true },
});

// Create a Model
const Proposal: Model<IProposal> = mongoose.model<IProposal>(
  'Proposal',
  proposalSchema,
);

export default Proposal;
