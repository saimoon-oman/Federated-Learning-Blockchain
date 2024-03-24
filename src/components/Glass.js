import './Glass.css'
import { useState } from 'react'
import axios from 'axios'
import parse from "html-react-parser";
import { abi_fedLearning, contractAddress_fedLearning, abi_flockie, contractAddress_flockie, FLK_wolf, FLK_elephant, FLK_tiger } from './sc_config'
import Web3 from 'web3'
import UploadPage from './UploadPage'

function Glass() {
  const [x, setx] = useState(9)
  const [committee, setcommittee] = useState(3)
  const [threshold, setthreshold] = useState(5)
  const [dataset, setdataset] = useState('')
  const [method, setmethod] = useState('')
  const [train, setTrain] = useState(false)
  const [approve, setApprove] = useState(false)
  const [server, setServer] = useState(false)
  const [update, setUpdate] = useState(false)

  const web3 = new Web3("http://localhost:7545")
  const fedLearning = new web3.eth.Contract(abi_fedLearning, contractAddress_fedLearning)


  const handleSubmit = async (e) => {
    console.log(dataset)
    console.log(method)
    e.preventDefault()      // Prevents the default form submission behavior to handle data via code.
    var accounts = []         // Initializes an empty array 'accounts' to store Ethereum accounts.
    const account_addr = await web3.eth.getAccounts()           // Retrieves Ethereum accounts available through Web3.
    // console.log("All Ethemereum Accounts: ")
    // console.log(account_addr)             // Logs the array of Ethereum accounts to the console.
    for (var element in account_addr) {       // Loops through the 'account_addr' array and adds each account to the 'accounts' array.
      accounts.push(account_addr[element])
    }
    const user_input_value = {
      "client": parseInt(x),
      "committee": parseInt(committee),
      "threshold": parseInt(threshold),
      "dataset": dataset,
      "method": method
    }
    const initial_score_and_serverhash = await axios.post('http://localhost:8080/initialize', user_input_value)
    // console.log("Here")
    await fedLearning.methods.setServer(initial_score_and_serverhash.data.server_hash).send({ from: accounts[0], gas: 3000000 })
    for (let i = 1; i <= x; i++) {
      fedLearning.methods.setScore(accounts[i], initial_score_and_serverhash.data.trust_score[i - 1]).send({ from: accounts[i], gas: 3000000 })
    }

    let startTime = new Date().getTime(); // Get current time in milliseconds

    let no_of_iteration = 3

    for (let it = 1; it <= no_of_iteration; it++) {
      let s_hash
      await fedLearning.methods.getServer().call().then((server) => {
        s_hash = server
      });
      const trust_score = []
      for (let i = 1; i <= x; i++) {
        await fedLearning.methods.getScore(accounts[i]).call().then((score) => {
          trust_score.push(score)
        });
      }
      const params = {
        "client": parseInt(x),
        "committee": parseInt(committee),
        "threshold": parseInt(threshold),
        "hash": s_hash,
        "trust_score": trust_score
      }
      const trust_score_and_serverhash = await axios.post('http://localhost:8080/trust_model', params)
      console.log("For iteration ", it, ": ")
      console.log("Trust score : ", trust_score_and_serverhash.data.trust_score)
      // console.log("After trust model call")
      s_hash = trust_score_and_serverhash.data.server_hash
      await fedLearning.methods.setServer(s_hash).send({ from: accounts[0], gas: 3000000 })
      // console.log("After getting server")
      for (let i = 1; i <= x; i++) {
        fedLearning.methods.setScore(accounts[i], trust_score_and_serverhash.data.trust_score[i - 1]).send({ from: accounts[i], gas: 3000000 })
        // console.log("After setting score")
      }
      const validation_input = {
        "server_hash": s_hash
      }
      // console.log("Before Validation")
      const model_performance = await axios.post('http://localhost:8080/model_validation', validation_input)

      console.log("Accuracy: ", model_performance.data.accuracy)
      console.log("Precision: ", model_performance.data.precision)
      console.log("Recall: ", model_performance.data.recall)
      console.log("F1-score: ", model_performance.data.f1)
      let endTime = new Date().getTime();
      let elapsedTime = endTime - startTime; // Calculate elapsed time in milliseconds
      console.log("Training time:", elapsedTime / 1000, "seconds");
    }

    let endTime = new Date().getTime();
    let elapsedTime = endTime - startTime; // Calculate elapsed time in milliseconds
    console.log("Training time:", elapsedTime / 1000, "seconds"); // Convert milliseconds to seconds for readability

    setTrain(true)   // Updates the state variable 'train' to true, indicating that the training process is completed.
  }


  return (
    <>
      {!train &&
        <div className="glass">
          <form onSubmit={(e) => handleSubmit(e)} className="glass__form">
            <h4>Train Clients</h4>
            <div className="glass__form__group">
              <h5>Number of Clients</h5>
              <input
                id="Client_count"
                className="glass__form__input"
                placeholder="Number of Clients"
                required
                autoFocus
                min="2"
                pattern="[0-9]{0,1}"
                title="Client count"
                type="number"
                value={x}
                onChange={(e) => setx(e.target.value)}
              />
              <h5>Number of Committee Members</h5>
              <input
                id="committee_count"
                className="glass__form__input"
                placeholder="Number of Committee Members"
                required
                min="1"
                pattern="[0-9]{0,1}"
                title="Committee count"
                type="number"
                value={committee}
                onChange={(e) => setcommittee(e.target.value)}
              />
              <h5>Initial Threshold Iteration to Begin Trust Model</h5>
              <input
                id="threshold_count"
                className="glass__form__input"
                placeholder="Initial Threshold Iteration to Begin Trust Model"
                required
                min="1"
                pattern="[0-9]{0,1}"
                title="Threshold count"
                type="number"
                value={threshold}
                onChange={(e) => setthreshold(e.target.value)}
              />
              <h5>Dataset</h5>
              <input
                id="dataset"
                className="glass__form__input"
                // placeholder="Dataset"
                required
                title="Dataset"
                pattern=".*"
                type="text"
                value={dataset}
                onChange={(e) => setdataset(e.target.value)}
              />
              <h5>Method</h5>
              <input
                id="method"
                className="glass__form__input"
                // placeholder="Method"
                required
                title="Method"
                type="text"
                value={method}
                onChange={(e) => setmethod(e.target.value)}
              />

            </div>
            <div className="glass__form__group">
              <button type="submit" className="glass__form__btn">
                Start Process
              </button>
            </div>
          </form>
        </div>}

      {train && !server &&
        <div className="glass">
          <h4>Process Completed</h4>
        </div>}

    </>)
}

export default Glass