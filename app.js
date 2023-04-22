const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();

const dbPath = path.join(__dirname, "todoApplication.db");
app.use(express.json());
let db = null;
const initializeServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("Server Running at http://localhost:3001/");
    });
  } catch (e) {
    console.log(`DB error:${e.message}`);
    process.exit(1);
  }
};

initializeServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasStatusProperty(request.query):
      getTodosQuery = `
      SELECT *
      FROM 
      todo
      WHERE
        todo LIKE '%${search_q}%' 
        AND status = '${status}'`;
      break;
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
        SELECT *
        FROM
        todo 
        WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
     SELECT *
     FROM
     todo 
     WHERE
     todo LIKE '%${search_q}%'
     AND priority = '${priority}';`;
      break;
    default:
      getTodosQuery = `
        SELECT *
        FROM
        todo 
        WHERE
        todo LIKE '%${search_q}%';`;
      break;
  }
  data = await db.all(getTodosQuery);
  response.send(data);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQueryOnId = `
    SELECT * 
    FROM 
    todo
    WHERE id = '${todoId}';`;
  const getResultOnId = await db.get(getTodoQueryOnId);
  response.send(getResultOnId);
});

app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status } = todoDetails;
  const createNewRowInTodo = `
    INSERT INTO 
    todo(id,todo,priority,status)
    VALUES
    ('${id}','${todo}','${priority}','${status}');
    `;
  const dbResponse = await db.run(createNewRowInTodo);
  response.send("Todo Successfully Added");
});
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  let updatedColumn = "";
  switch (true) {
    case requestBody.todo !== undefined:
      updatedColumn = "Todo";
      break;
    case requestBody.priority !== undefined:
      updatedColumn = "Priority";
      break;
    case requestBody.status !== undefined:
      updatedColumn = "Status";
      break;
  }
  const previousTodoQuery = `
  SELECT *
  FROM 
  todo
  WHERE 
  id = '${todoId}';`;
  const previousQuery = await db.get(previousTodoQuery);
  const {
    todo = requestBody.todo,
    priority = requestBody.priority,
    status = requestBody.status,
  } = previousQuery;
  const updatedQuery = `
   UPDATE 
   todo 
   SET
   todo = '${todo}',
   priority = '${priority}',
   status = '${status}'
   WHERE 
   id = '${todoId}';`;
  const result = await db.run(updatedQuery);
  response.send(`${updatedColumn} updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
    DELETE FROM
    todo
    WHERE 
    id = '${todoId}';`;
  const result = await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = express();
