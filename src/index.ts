import { openapi } from "@elysiajs/openapi";
import { SQL } from "bun";
import { Elysia, status } from "elysia";

const sqlite = new SQL("sqlite://src/data.db");

const app = new Elysia({ prefix: "/api" })
  .use(
    openapi({
      documentation: {
        info: {
          title: "Spotiskill API",
          version: "1.0.0",
        },
      },
    })
  )
  .get("/signup", async () => {
    const data = await sqlite`SELECT * FROM SignupRequest`;

    return status(200, { data });
  })

  .get("/songs", async () => {
    const data = await sqlite`
      SELECT S.id, S.title, S.artist, A.id as album_id, A.title as album_title, release_date
      FROM Song AS S
      INNER JOIN Album AS A ON S.album_id = A.id
    `;

    return status(200, {
      data: data.map((item: any) => {
        return {
          id: item.id,
          title: item.title,
          artist: item.artist,
          album: {
            id: item.album_id,
            title: item.album_title,
            artist: item.artist,
            release_date: item.release_date,
          },
        };
      }),
    });
  })

  .get("/songs/:id", async ({ params }) => {
    const data = await sqlite`
      SELECT S.id, S.title, S.artist, A.id AS album_id, A.title AS album_title, A.release_date AS release_date
      FROM Song AS S
      INNER JOIN Album AS A ON S.album_id = A.id
      WHERE S.id = ${params.id}
    `;

    if (data.length !== 1) {
      return status(404, { message: "La chanson n'existe pas" });
    }

    return status(200, {
      data: {
        id: data[0].id,
        title: data[0].title,
        artist: data[0].artist,
        album: {
          id: data[0].album_id,
          title: data[0].album_title,
          artist: data[0].artist,
          release_date: data[0].release_date,
        },
      },
    });
  })

  .get("/playlists", async () => {
    const data = await sqlite`
      SELECT P.id, P.title, author, songs, S.id, S.title
      FROM Playlist AS P
      INNER JOIN Song AS S
      ON S.id = P.id
      WHERE
    `;

    return status(200, { data });
  })

  .listen(8080);
