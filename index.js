const express = require('express');
const app = express();
const PORT = 8080;

app.use( express.json() )

app.listen(PORT, () => {
    console.log(`Example app listening at http://localhost:${PORT}`);
    // addTransaction({ "payer": "DANNON", "points": 300, "timestamp": "2020-10-31T10:00:00Z" });
})

let transactions = [];

let payerScorecard = {};

// adds points to transactions and updates scorecard
function addTransaction(t) {
    t["date"] = new Date(t.timestamp)

    addValueFromScorecard(t);

    const before = findIndexBelow(t);
    transactions.splice(before, 0, t)
}


// takes a transaction and adds it to scorecard
function addValueFromScorecard(t) {
    if (t.payer in payerScorecard){
        payerScorecard[t.payer] += t.points;
    }else{
        payerScorecard[t.payer] = t.points;
    }
}

//removes points from scorecard 
function removeValueFromScorecard(t){
    if (t.payer in payerScorecard){
        payerScorecard[t.payer] -= t.points;
    }else{
        payerScorecard[t.payer] = -t.points;
    }
}

// finds index to store incoming transaction in sorted list
function findIndexBelow(t){
    let low = 0;
    let high = transactions.length;

    while (low < high){

        const mid = Math.floor((low + high)/2);
        if (transactions[mid].date > t.date) {
            high = mid;
        }else{
            low = mid + 1;
        }
    }
    return low;
}

// increments through transactions until all points are gone
// updates scorecard and transaction array accordingly
function processPoints(points) {
    const pointsRemoved = {};

    while (points > 0) {
        let trxn = transactions[0];
        if (trxn.points <= points) {
            transactions.shift();
            points -= trxn.points;
            pointsRemoved[trxn.payer] = 
                pointsRemoved[trxn.payer] ?
                pointsRemoved[trxn.payer] - trxn.points
                :
                -trxn.points
                                    
            removeValueFromScorecard(trxn);
        }else {
            // remove remaining points from next transaction
            // also remove points from scorecard
            transactions[0].points -= points;
            
            payerScorecard[trxn.payer] -= points;
            pointsRemoved[trxn.payer] = 
                pointsRemoved[trxn.payer] ?
                pointsRemoved[trxn.payer] - points
                :
                (-points)
            points = 0;
        }
    }

    let pointsArr = []
    for (const payer in pointsRemoved) {
        pointsArr.push({
            payer: payer,
            points: pointsRemoved[payer]
        })
    }
    return pointsArr;
}




app.get('/', (req, res) => {
    res.send(payerScorecard)
})

app.post('/', (req, res) => {
    if (req.body.payer){
        addTransaction(req.body);
        res.status(200).send("processed!")
    }else{
        let trxn = processPoints(req.body.points);
        res.status(200).send(trxn);
    }
})
