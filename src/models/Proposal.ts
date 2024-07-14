import mongoose, { Document, Schema, Model } from 'mongoose';

type AddressData = {
  from: string;
  amount: string;
};
interface IProposal extends Document {
  tokenName: string;
  tokenAddress: string;
  contractAddress: string;
  merkelRoot: string;
  ResolverAddress: string;
  schemUid: string;
  status: 'active' | 'approved' | 'rejected';
  addresses: AddressData[];
  totalAmount: string;
  totalAccount: string;
  chainId: string;
}

const addressSchema: Schema<AddressData> = new Schema({
  from: { type: String, required: true },
  amount: { type: String, required: true },
});
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
  addresses: { type: [addressSchema], required: true },
  totalAmount: { type: String, required: true },
  totalAccount: { type: String, required: true },
  chainId: { type: String, required: true },
});

// Create a Model
const Proposal: Model<IProposal> = mongoose.model<IProposal>(
  'Proposal',
  proposalSchema,
);

export default Proposal;
