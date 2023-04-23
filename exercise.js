const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;
// This is my password file containing my password to my Mongo. I keep it in a separate file and import it but for my own privacy I'm not addinog that file
const { password } = require("./pass.js");
const url = "mongodb+srv://nate_nemeth:" + password + "@cluster0.5sv2hjr.mongodb.net/?retryWrites=true&w=majority";
const { username } = require("./login.js");
const bodyParser = require('body-parser');
const express = require("express");
const app = express();

const port = 3000;

app.use(bodyParser.json());

// Endpoint to get all exercises based off the users preferences
app.get("/exercise", async function (req, res) {
    let query = createQuery(req);
    try {
        var exercises = await getExercises(query);
    } catch (err) {
        res.status(400).end("Search resulted in errors");
    }
    res.status(200).send(exercises);
})

// Endpoint to add an exercise as described by the user
app.post("/exercise", async function (req, res) {
    let query = createQuery(req);
    if (!checkInput(query)) {
        res.status(400).end("Invalid Input Parameteres");
    }
    try {
        await addExercise(query);
    } catch (err) {
        res.status(400).end("Create resulted in errors");
    }
    // Do we want to send anything back here?
    res.status(200).send();
})

// Endpoint to change an exercise indicated by the user
app.put("/exercise", async function (req, res) {
    if (req.body.id === undefined) {
        res.status(400).end("Invalid Input Parameters");
    }
    let query = { "_id" : new mongodb.ObjectId(req.body.id) };
    let changes = { $set : createQuery(req) };
    try {
        // var changed = await changeExercise(query, changes);
        await changeExercise(query, changes);
    } catch (err) {
        res.status(400).end("Change resulted in errors");
    }
    // What's sent back here might be useful in case of an undo button
    res.status(200).send();
})

// Endpoint to delete an exercise indicated by the user
app.delete("/exercise", async function (req, res) {
    if (req.body.id === undefined) {
        res.status(400).end("Invalid Input Parameters")
    }
    let query = { "_id" : new mongodb.ObjectId(req.body.id) };
    try {
        // var removed = await removeExercise(query);
        await removeExercise(query);
    } catch (err) {
        res.status(400).end("Delete resulted in errors");
    }
    // What's sent back here might be useful in case of an undo button
    res.status(200).send();
})

// Creats a JSON query that can be used in MongoDB functions
// Decides what the query will have in it based on what is sent by the user
function createQuery(req) {
    let query  = {};
    if (req.body.name !== undefined) {
        query["name"] = req.body.name;
    }
    if (req.body.date !== undefined) {
        query["date"] = req.body.date;
    }
    if (req.body.reps !== undefined) {
        query["reps"] = req.body.reps;
    }
    if (req.body.sets !== undefined) {
        query["sets"] = req.body.sets;
    }
    if (req.other !== undefined) {
        query["other"] = req.body.other;
    }
    return query;
}

// Gets all the exercises that satisfies the query from MongoDB
async function getExercises(query) {
    const client = new MongoClient(url);
    client.connect();
    const collect = client.db("exercises").collection(username);
    let exercise = await collect.find(query).toArray();
    await client.close();
    return exercise;
}

// Creates a new exercise based off the query in MongoDB
async function addExercise(query) {
    const client = new MongoClient(url);
    client.connect();
    const collect = client.db("exercises").collection(username);
    await collect.insertOne(query);
    await client.close();
}

// Changes an existing exercise based off the query in MongoDB
async function changeExercise(query, changes) {
    const client = new MongoClient(url);
    client.connect();
    const collect = client.db("exercises").collection(username);
    await collect.updateOne(query, changes);
    await client.close();
}

// Removes an exercise identified by the unique id in the query in MongoDB
async function removeExercise(query) {
    const client = new MongoClient(url);
    client.connect();
    const collect = client.db("exercises").collection(username);
    await collect.deleteOne(query);
    await client.close();
    // return deleted;
}

// Checks that the query contains all information about an exercise
function checkInput(query) {
    if (!query.hasOwnProperty("name")) {
        return false;
    } else if (!query.hasOwnProperty("date")) {
        return false;
    } else if (!query.hasOwnProperty("reps")) {
        return false;
    } else if (!query.hasOwnProperty("sets")) {
        return false;
    }
    return true;
}

// Starts the server
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
