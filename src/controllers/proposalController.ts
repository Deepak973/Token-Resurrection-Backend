import Proposal from '../models/Proposal';
import express, { Request, Response } from 'express';

const router = express.Router();

// Add a new proposal
router.post('/proposals', async (req, res) => {
  const {
    merkelRoot,
    ResolverAddress,
    schemUid,
    selectedToken,
    addresses,
    totalAmount,
    totalAccount,
    chainId,
  } = req.body;

  console.log(req.body);

  try {
    const existingProposal = await Proposal.findOne({
      tokenAddress: selectedToken.tokenAddress,
      contractAddress: selectedToken.contractAddress,
    });
    if (existingProposal) {
      return res.status(400).json({ message: 'Proposal already exists' });
    }

    const newProposal = new Proposal({
      tokenName: selectedToken.tokenName,
      tokenAddress: selectedToken.tokenAddress,
      contractAddress: selectedToken.contractAddress,
      merkelRoot: merkelRoot,
      ResolverAddress: ResolverAddress,
      schemUid: schemUid,
      addresses: addresses,
      totalAmount: totalAmount,
      totalAccount: totalAccount,
      chainId: chainId,
    });
    await newProposal.save();

    res.status(201).json({
      message: 'Proposal created successfully',
      proposal: newProposal,
    });
  } catch (error) {
    console.error('Error creating proposal:', error);
    res
      .status(500)
      .json({ error: 'An error occurred while creating the proposal' });
  }
});

router.get('/checkproposals', async (req, res) => {
  const { tokenAddress, contractAddress } = req.query;

  console.log(req.query);

  try {
    const existingProposal = await Proposal.findOne({
      tokenAddress,
      contractAddress,
    });
    if (existingProposal) {
      return res.status(201).json({ message: 'Proposal already exists' });
    }
    return res.status(200).json({ message: 'Proposal can be added' });
  } catch (error) {
    console.error('Error checking proposal:', error);
    res
      .status(500)
      .json({ error: 'An error occurred while checking the proposal' });
  }
});
// Approve a proposal
router.post('/proposals/:id/approve', async (req, res) => {
  const { id } = req.params;
  try {
    const proposal = await Proposal.findById(id);
    if (!proposal) {
      return res.status(200).json({ message: 'Proposal not found' });
    }
    if (proposal.status !== 'active') {
      return res
        .status(400)
        .json({ message: `Proposal is already ${proposal.status}` });
    }
    proposal.status = 'approved';
    await proposal.save();
    res
      .status(200)
      .json({ message: 'Proposal approved successfully', proposal });
  } catch (error) {
    console.error('Error approving proposal:', error);
    res
      .status(500)
      .json({ error: 'An error occurred while approving the proposal' });
  }
});

// Reject a proposal
router.post('/proposals/:id/reject', async (req, res) => {
  const { id } = req.params;
  try {
    const proposal = await Proposal.findById(id);
    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }
    if (proposal.status !== 'active') {
      return res
        .status(400)
        .json({ message: `Proposal is already ${proposal.status}` });
    }

    proposal.status = 'rejected';
    await proposal.save();
    res
      .status(200)
      .json({ message: 'Proposal rejected successfully', proposal });
  } catch (error) {
    console.error('Error rejecting proposal:', error);
    res
      .status(500)
      .json({ error: 'An error occurred while rejecting the proposal' });
  }
});

// Get all proposals
router.get('/proposals/all', async (req, res) => {
  try {
    const proposals = await Proposal.find();
    res.status(200).json(proposals);
  } catch (error) {
    console.error('Error fetching all proposals:', error);
    res
      .status(500)
      .json({ error: 'An error occurred while fetching all proposals' });
  }
});

// Get a proposal by token and contract address
router.get('/proposals', async (req, res) => {
  const { tokenAddress, contractAddress } = req.query;
  try {
    const proposal = await Proposal.findOne({ tokenAddress, contractAddress });
    res.status(200).json(proposal);
  } catch (error) {
    console.error('Error fetching proposal:', error);
    res
      .status(500)
      .json({ error: 'An error occurred while fetching the proposal' });
  }
});

// Get all proposals for a token address
router.get('/proposals/token/:tokenAddress', async (req, res) => {
  const { tokenAddress } = req.params;
  try {
    const proposals = await Proposal.find({ tokenAddress });
    res.status(200).json(proposals);
  } catch (error) {
    console.error('Error fetching proposals:', error);
    res
      .status(500)
      .json({ error: 'An error occurred while fetching the proposals' });
  }
});

// Get proposals by status
router.get('/proposals/status/:status', async (req, res) => {
  const { status } = req.params;
  try {
    const proposals = await Proposal.find({ status });
    if (proposals.length === 0) {
      return res
        .status(200)
        .json({ message: `No proposals found with status: ${status}` });
    }
    res.status(200).json(proposals);
  } catch (error) {
    console.error('Error fetching proposals by status:', error);
    res.status(500).json({
      error: 'An error occurred while fetching the proposals by status',
    });
  }
});

export default router;
