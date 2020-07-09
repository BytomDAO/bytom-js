let Input = require('../lib/transaction/input.js')
const Output = require('../lib/transaction/output.js')
let {mapTx} = require('../lib/transaction/map.js')
const  BTMAssetID  = require('../../lib/util/constance').BTMAssetID
let bcSpend = require('../lib/bc/spend.js')

let _ = require('lodash');

const should = require('chai').should();
const expect = require('chai').expect;
let BN = require('bn.js')


describe('Map', function() {

  let testcase =[
    {
      inputs: [
        Input.newSpendInput(null, "fad5195a0c8e3b590b86a3c0a95e7529565888508aecca96e9aeda633002f409", BTMAssetID, 88, 3, Buffer.from([1])),
      ],
      outputs: [
        Output.newIntraChainOutput(BTMAssetID, 80, Buffer.from[1]),
      ]
    }
  ]

  let txData = {
    inputs: [
      Input.newCoinbaseInput(new Buffer("TestMapCoinbaseTx")),
    ],
    outputs: [
      Output.newIntraChainOutput(BTMAssetID, 800000000000, Buffer.from[1]),
    ]
  }
  it('TestMapSpendTx', function () {
    for(let txData of testcase){
      let tx = mapTx(txData)
      let resultIds = tx.entries[_.findKey(tx.entries, 'resultIDs')].resultIDs
      resultIds.length.should.equal(txData.outputs.length)


      for(let i = 0; i< txData.inputs.length; i++) {
        let oldIn = txData.inputs[i]
        let resultEntry = tx.entries[tx.inputIDs[i]]

        expect(resultEntry).not.to.be.undefined;
        if (resultEntry instanceof bcSpend) {
          let spendOut = tx.entries[resultEntry.spentOutputId];
          expect(spendOut.source.value).to.equal(oldIn.assetAmount())
        } else {
          throw Error("unexpect input type")
        }
      }

      for(let i = 0; i< txData.outputs.length; i++) {
        let oldOut = txData.outputs[i].typedOutput
        let newOut =tx.entries[resultIds[i]];

        expect(newOut).not.to.be.undefined;

        expect(newOut.source.value).to.equal(oldOut.outputCommitment.assetAmount)
        expect(newOut.controlProgram.vmVersion).to.deep.equal(new BN(1))
        expect(newOut.controlProgram.code).to.equal(oldOut.controlProgram)

      }
    }
  });

  it('TestMapCoinbaseTx', function () {
    let oldOut = txData.outputs[0].typedOutput

    let tx = mapTx(txData)
    let resultIds = tx.entries[_.findKey(tx.entries, 'resultIDs')].resultIDs

    expect(tx.inputIDs.length).to.equal(1)
    expect(tx.spentOutputIDs.length).to.equal(0)
    expect(tx.gasInputIDs.length).to.equal(1)
    expect(resultIds.length).to.equal(1)

    let newOut = tx.entries[resultIds[0]]
    expect(newOut).not.to.be.undefined;
    expect(newOut.source.value).to.equal(oldOut.outputCommitment.assetAmount)

    let mux = tx.entries[newOut.source.ref]
    expect(mux).not.to.be.undefined;
    expect(mux.witnessDestinations[0].value).to.equal(newOut.source.value)

    let coinbase = tx.entries[tx.inputIDs[0]]
    expect(coinbase).not.to.be.undefined;
    expect(coinbase.witnessDestination.value).to.equal(mux.sources[0].value)
  });

})