const express = require("express");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "moviesData.db");

let database = null;

const initializationDBAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => console.log("app is running in the port of 3000"));
  } catch (e) {
    console.log(`DB ERROR ${e.message}`);
    process.exit(1);
  }
};

initializationDBAndServer();

const convertMovieDbObjectToResponseObject = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};

const ConvertDirectorDbObjectToResponseObject = (dbObject) => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  };
};

app.get("/movies/", async (request, response) => {
  const dbQuery = `SELECT movie_name FROM  movie`;
  const movie_details = await database.all(dbQuery);
  response.send(
    movie_details.map((eachMovieName) =>
      convertMovieDbObjectToResponseObject(eachMovieName)
    )
  );
});

app.post("/movies/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  const dbQuery = `INSERT INTO movie(director_id,movie_name,lead_actor)
    VALUES( ${directorId},
        '${movieName}',
        '${leadActor}' )`;

  const updateMovie = await database.run(dbQuery);
  response.send("Movie Successfully Added");
});

app.get("/movies/:movieId", async (request, response) => {
  const { movieId } = request.params;

  const dbQuery = `SELECT * FROM movie WHERE movie_id = ${movieId}`;
  const GetMovie = await database.get(dbQuery);
  response.send(convertMovieDbObjectToResponseObject(GetMovie));
});

app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const { movieName, directorId, leadActor } = request.body;

  const dbQuery = `UPDATE movie SET
    director_id = ${directorId},
    movie_name = '${movieName}',
    lead_actor = '${leadActor}'
    WHERE movie_id = ${movieId};
    `;

  await database.run(dbQuery);
  response.send("Movie Details Updated");
});

app.delete("/movies/:movieId", async (request, response) => {
  const { movieId } = request.params;
  const dbQuery = `DELETE FROM movie WHERE movie_id = ${movieId}`;

  await database.run(dbQuery);
  response.send("Movie Removed");
});

app.get("/directors/", async (request, response) => {
  const dbQuery = `SELECT * FROM director`;

  const directorList = await database.all(dbQuery);
  response.send(
    directorList.map((eachDirector) =>
      ConvertDirectorDbObjectToResponseObject(eachDirector)
    )
  );
});

app.get("/directors/:directorId/movies", async (request, response) => {
  const { directorId } = request.params;
  const dbQuery = `SELECT movie_name FROM movie WHERE director_id = ${directorId}`;

  const director_directed_movies = await database.all(dbQuery);
  response.send(
    director_directed_movies.map((eachMovie) => ({
      movieName: eachMovie.movie_name,
    }))
  );
});

module.exports = app;
