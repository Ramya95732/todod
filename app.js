const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const format = require('date-fns/format')

const isMatch = require('date-fns/isMatch')
const isValid = require('date-fns/isValid')

const dbPath = path.join(__dirname, 'todoApplication.db')
const app = express()
app.use(express.json())

let db = null
const initialiseServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error : ${e.message}`)
  }
}
initialiseServer()

const hasPriorityAndStatus = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasCategoryAndStatus = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  )
}

const hasCategoryAndPriority = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  )
}

const hasStatus = requestQuery => {
  return requestQuery.status !== undefined
}

const hasPriority = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasCategory = requestQuery => {
  return requestQuery.category !== undefined
}

const hasDueDate = requestQuery => {
  return requestQuery.dueDate !== undefined
}

const isValidPriority = item => {
  if (item === 'HIGH' || item === 'MEDIUM' || item === 'LOW') {
    return true
  } else {
    return false
  }
}

const isValidCategory = item => {
  if (item === 'WORK' || item === 'HOME' || item === 'LEARNING') {
    return true
  } else {
    return false
  }
}

const isValidStatus = item => {
  if (item === 'TO DO' || item === 'IN PROGRESS' || item === 'DONE') {
    return true
  } else {
    return false
  }
}

const isValidDueDate = item => {
  return isValid(new Date(item))
}

const convertDueDate = dbObject => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    category: dbObject.category,
    priority: dbObject.priority,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  }
}

//API1
app.get('/todos/', async (request, response) => {
  let data = null
  let getTodoQuery = ''
  const {search_q = '', priority, status, category} = request.query

  switch (true) {
    case hasPriorityAndStatus(request.query):
      getTodoQuery = `
        SELECT 
        *
        FROM 
        todo
        WHERE
        todo LIKE '%${search_q}%'
        AND priority ='${priority}'
        AND status='${status}'
      `
      if (isValidPriority(priority) && isValidStatus(status)) {
        data = await db.all(getTodoQuery)
        response.send(data.map(obj => convertDueDate(obj)))
      } else if (isValidPriority(priority)) {
        response.status(400)
        response.send('Invalid Todo Status')
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }

      break

    case hasCategoryAndStatus(request.query):
      getTodoQuery = `
        SELECT 
        * 
        FROM
        todo
        WHERE
        todo LIKE '%${search_q}%' AND
        category='${category}' AND 
        status='${status}'
      `
      if (isValidCategory(category) && isValidStatus(status)) {
        data = await db.all(getTodoQuery)
        response.send(data.map(obj => convertDueDate(obj)))
      } else if (isValidCategory(category)) {
        response.status(400)
        response.send('Invalid Todo Status')
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    case hasCategoryAndPriority(request.query):
      getTodoQuery = `
        SELECT 
        * 
        FROM
        todo
        WHERE
        todo LIKE '%${search_q}%' AND
        category='${category}' AND 
        priority='${priority}'
      `
      if (isValidCategory(category) && isValidPriority(priority)) {
        data = await db.all(getTodoQuery)
        response.send(data.map(obj => convertDueDate(obj)))
      } else if (isValidCategory(category)) {
        response.status(400)
        response.send('Invalid Todo Priority')
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    case hasCategory(request.query):
      getTodoQuery = `
        SELECT
        *
        FROM
        todo
        WHERE
        todo LIKE '%${search_q}%' AND
        category='${category}'
      `
      if (isValidCategory(category)) {
        data = await db.all(getTodoQuery)
        response.send(data.map(obj => convertDueDate(obj)))
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    case hasPriority(request.query):
      getTodoQuery = `
        SELECT 
        *
        FROM
        todo
        WHERE
        todo LIKE '%${search_q}%'
        AND priority ='${priority}'
      `
      if (isValidPriority(priority)) {
        data = await db.all(getTodoQuery)
        response.send(data.map(obj => convertDueDate(obj)))
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break

    case hasStatus(request.query):
      getTodoQuery = `
        SELECT 
        * 
        FROM
        todo
        WHERE
        todo LIKE '%${search_q}%' AND
        status='${status}'
      `
      if (isValidStatus(status)) {
        data = await db.all(getTodoQuery)
        response.send(data.map(obj => convertDueDate(obj)))
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break
    default:
      getTodoQuery = `
      SELECT
      *
      FROM
      todo
      WHERE
      todo LIKE '%${search_q}%'
      `
      data = await db.all(getTodoQuery)
      response.send(data.map(obj => convertDueDate(obj)))
      break
  }
})

//API2
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const selectTodoQuery = `
    SELECT
    *
    FROM
    todo
    WHERE
    id=${todoId}
  `
  const dbResponse = await db.get(selectTodoQuery)
  response.send(dbResponse)
})

//API3
app.get('/agenda/', async (request, response) => {
  const {date} = request.query
  if (date === undefined) {
    response.status(400)
    response.send('Invalid Due Date')
  } else {
    if (isValidDueDate(date)) {
      const formattedDate = format(new Date(date), 'yyyy-MM-dd')
      const getTodoQuery = `
        SELECT
        *
        FROM
        todo
        WHERE
        due_date='${formattedDate}'
      `
      const dbResponse = await db.all(getTodoQuery)
      response.send(dbResponse.map(obj => convertDueDate(obj)))
    } else {
      response.status(400)
      response.send('Invalid Due Date')
    }
  }
})

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request.body

  switch (false) {
    case isValidPriority(priority):
      response.status(400)
      response.send('Invalid Todo Priority')
      break
    case isValidCategory(category):
      response.status(400)
      response.send('Invalid Todo Category')
      break
    case isValidStatus(status):
      response.status(400)
      response.send('Invalid Todo Status')
      break
    case isValidDueDate(dueDate):
      response.status(400)
      response.send('Invalid Due Date')
      break
    default:
      const formattedDate = format(new Date(dueDate), 'yyyy-MM-dd')
      const createQuery = `
        INSERT INTO
          todo (id, todo, priority, status, category, due_date)
        VALUES
        (
          ${id},
          '${todo}',
          '${priority}',
          '${status}',
          '${category}',
          '${formattedDate}'
        )
      `
      await db.run(createQuery)
      response.send('Todo Successfully Added')
      break
  }
})

//API5
app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const {todo, priority, status, category, dueDate} = request.body
  switch (true) {
    case hasStatus(request.body):
      const updateTodoQuery = `
        UPDATE 
        todo
        SET
        status='${status}'
        WHERE
        id=${todoId}
      `
      if (isValidStatus(status)) {
        await db.run(updateTodoQuery)
        response.send('Status Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break
    case hasCategory(request.body):
      const updateTodoQuery1 = `
        UPDATE
        todo
        SET 
        category='${category}
        WHERE
        id=${todoId}
      `
      if (isValidCategory(category)) {
        await db.run(updateTodoQuery1)
        response.send('Category Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case hasPriority(request.body):
      const updateTodoQuery2 = `
        UPDATE
        todo
        SET 
        priority='${priority}'
        WHERE
        id=${todoId}
      `
      if (isValidPriority(priority)) {
        await db.run(updateTodoQuery2)
        response.send('Priority Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case hasDueDate(request.body):
      const updateTodoQuery3 = `
        UPDATE
        todo
        SET
        due_date='${dueDate}'
        WHERE
        id=${todoId}
      `
      if (isValidDueDate(dueDate)) {
        await db.run(updateTodoQuery3)
        response.send('Due Date Updated')
      } else {
        response.status(400)
        response.send('Invalid Due Date')
      }
      break
    default:
      const updateTodoQuery4 = `
        UPDATE
        todo
        SET
        todo='${todo}'
        WHERE
        id=${todoId}
      `
      await db.run(updateTodoQuery4)
      response.send('Todo Updated')
      break
  }
})

//API6
app.delete("/todos/:todoId/", async (request, response)=>{
  const {todoId}=request.params
  const deleteQuery=`
    DELETE FROM todo
    WHERE id=${todoId}
  `
  await db.get(deleteQuery)
  response.send("Todo Deleted")
})

module.exports = app
