const Constance = require('./constance')
const VetoInput = require('../transaction/vetoInput')
const CoinbaseInput = require('../transaction/coinbaseInput')
const BcVetoInput = require('../bc/vetoInput')
const BcCrosschainInput = require('../bc/crosschainInput')
const BcSpend = require('../bc/spend')
const BcCoinbase = require('../bc/coinbase')
const BcIntraChainOutput = require('../bc/intraChainOutput')
const BcCrossChainOutput = require('../bc/crossChainOutput')
const BcVoteOutput = require('../bc/voteOutput')
const BTMAssetID = require('../../../lib/util/constance').BTMAssetID

function buildAnnotatedInput(tx, i) {
  let orig = tx.inputs[i].typedInput
  const inp = {}
  const spendCommitment = orig.spendCommitment.toObject()
  if (!(orig instanceof CoinbaseInput)) {
    let assetAmount = spendCommitment.assetAmount
    inp.assetID = assetAmount.assetID
    inp.amount = assetAmount.amount
    let signData = tx.Tx.sigHash(i)
    inp.signData = signData
    let vetoInput = orig.typedInput
    if (vetoInput instanceof VetoInput) {
      inp.vote = vetoInput.vote
    }
  } else {
    inp.assetID = BTMAssetID
  }

  let id = tx.Tx.inputIDs[i]
  inp.inputID = id
  let e = tx.Tx.entries[id]
  if (e.typ() === BcVetoInput.prototype.typ()) {

    inp.type = "veto"
    inp.controlProgram = spendCommitment.controlProgram
    inp.spentOutputID = e.spentOutputId
    let _arguments = orig.arguments
    for (let _arg of _arguments) {
      const arg = Buffer.isBuffer(_arg) ? _arg.toString('hex') : _arg
      inp.arguments = (Array.isArray(inp.arguments) ? inp.arguments.push(arg) : [arg])
    }
  } else if (e.typ() === BcCrosschainInput.prototype.typ()) {

    inp.type = "cross_chain_in"
    let controlProgram = spendCommitment.controlProgram
    inp.controlProgram = controlProgram
    inp.spentOutputID = e.mainchainOutputId
    let _arguments = orig.arguments
    for (let _arg of _arguments) {
      const arg = Buffer.isBuffer(_arg) ? _arg.toString('hex') : _arg
      inp.arguments = (Array.isArray(inp.arguments) ? inp.arguments.push(arg) : [arg])
    }
  } else if (e.typ() === BcSpend.prototype.typ()) {
    inp.type = "spend"
    let controlProgram = spendCommitment.controlProgram

    inp.controlProgram = controlProgram
    inp.spentOutputID = e.spentOutputId
    let _arguments = orig.arguments
    for (let _arg of _arguments) {
      const arg = Buffer.isBuffer(_arg) ? _arg.toString('hex') : _arg
      inp.arguments = (Array.isArray(inp.arguments) ? inp.arguments.push(arg) : [arg])
    }
  } else if (e.typ() === BcCoinbase.prototype.typ()) {
    inp.type = "coinbase"
    inp.arbitrary = e.arbitrary
  }
  return inp
}

function buildAnnotatedOutput(tx, idx) {
  let orig = tx.outputs[idx].typedOutput
  let outid = tx.Tx.txHeader.resultIDs[idx]
  const outputCommitment = orig.outputCommitment.toObject()

  let out = {
    outputID: outid,
    position: idx,
    assetID: outputCommitment.assetAmount.assetID,
    amount: outputCommitment.assetAmount.amount,
    controlProgram: outputCommitment.controlProgram,
  }

  let isMainchainAddress

  let e = tx.Tx.entries[outid]

  if (e.typ() === BcIntraChainOutput.prototype.typ()) {
    out.type = "control"
    isMainchainAddress = false
  } else if (e.typ() === BcCrossChainOutput.prototype.typ()) {
    out.type = "cross_chain_out"
    isMainchainAddress = true
  } else if (e.typ() === BcVoteOutput.prototype.typ()) {
    out.type = "vote"
    out.vote = Buffer.isBuffer(e.vote) ? e.vote.toString("hex"): e.vote
    isMainchainAddress = false
  }

  return out
}

module.exports = {
  buildAnnotatedInput,
  buildAnnotatedOutput
}