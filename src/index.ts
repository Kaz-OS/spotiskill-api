import { openapi } from "@elysiajs/openapi";
import { SQL } from "bun";
import { Elysia, status, t } from "elysia";

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
  .get(
    "/signup",
    async () => {
      const data = await sqlite`
      SELECT id, email, first_name, last_name, status
      FROM SignupRequest
    `;

      return status(200, { signup: data });
    },
    {
      response: {
        200: t.Object(
          {
            signup: t.Array(
              t.Object({
                id: t.Number({ description: "Identifiant unique de la demande d'inscription" }),
                email: t.String({ description: "Adresse email de l'utilisateur", format: "email" }),
                first_name: t.Optional(t.String({ description: "Prénom de l'utilisateur" })),
                last_name: t.Optional(t.String({ description: "Nom de famille de l'utilisateur" })),
                status: t.UnionEnum(["pending", "accepted", "rejected"], {
                  description: "Satut de la demande d''inscription",
                }),
              })
            ),
          },
          { description: "OK" }
        ),
      },
      detail: {
        summary: "Récupère une liste de connexion",
        description: "",
      },
    }
  )

  .get(
    "/songs",
    async () => {
      const data = await sqlite`
        SELECT S.id, S.title, S.artist, A.id as album_id, A.title as album_title, release_date
        FROM Song AS S
        INNER JOIN Album AS A ON S.album_id = A.id
      `;

      return status(200, {
        songs: data.map((item: any) => {
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
    },
    {
      response: {
        200: t.Object(
          {
            songs: t.Array(
              t.Object({
                id: t.Number({ description: "Identifiant unique de la chanson" }),
                title: t.String({ description: "Titre de la chanson" }),
                artist: t.String({ description: "Artiste de la chanson" }),
                album: t.Object({
                  id: t.Number({ description: "Identifiant de l'Album" }),
                  title: t.String({ description: "Titre de l'Album" }),
                  Artiste: t.String({ description: "Nom de l'Artiste qui a créer l'Album" }),
                  release_date: t.String({ format: "date", description: "Date de sortie de l'Album" }),
                }),
              })
            ),
          },
          { description: "OK" }
        ),
      },

      detail: {
        summary: "Récupère une liste de chansons",
        description: "",
      },
    }
  )

  .get(
    "/songs/:id",
    async ({ params }) => {
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
        song: {
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
    },
    {
      params: t.Object({
        id: t.Number({ description: "ID de la chanson à récupérer" }),
      }),
      response: {
        200: t.Object(
          {
            song: t.Object({
              id: t.Number({ description: "Identifiant unique de la chanson" }),
              title: t.String({ description: "Titre de la chanson" }),
              artist: t.String({ description: "Artiste de la chanson" }),
              album: t.Object({
                id: t.Number({ description: "Identifiant unique de l'album" }),
                title: t.String({ description: "Titre de l'album" }),
                artist: t.String({ description: "Nom de l'artiste qui a créé l'album" }),
                release_date: t.String({ format: "date", description: "Date de sortie de l'album" }),
              }),
            }),
          },
          { description: "OK" }
        ),
        404: t.Object(
          {
            message: t.String({ examples: ["La chanson n'existe pas"] }),
          },
          { description: "La chason n'existe pas" }
        ),
      },
      detail: {
        summary: "Récupère une chanson par ID",
        description: "Récupère une chanson par son identifiant unique",
      },
    }
  )

  .get("/albums", async () => {
    const data = await sqlite`
    SELECT A.id as Album_id, A.title AS Album_title, A.artist, release_date, S.title AS Song_title, S.id AS song_id,  S.title AS Song_title
    FROM Album AS A
    INNER JOIN song AS S
    ON A.id = S.album_id
    `;
    return status(200, {
      data: data.map((item: any) => {
        return {
          Album_id: item.Album_id,
          Album_title: item.Album_title,
          artist: item.artist,
          song: {
            song_id: item.song_id,
            Song_title: item.Song_title,
          },
        };
      }),
    });
  })

  .get(
    "/playlists",
    async () => {
      const data = await sqlite`
        SELECT P.id, P.title, P.author, S.id AS song_id, S.title AS song_title, S.artist AS song_artist
        FROM Playlist AS P
        INNER JOIN PlaylistSong AS PS ON P.id = PS.playlist_id
        INNER JOIN Song AS S ON PS.song_id = S.id
        ORDER BY P.id, PS.position
      `;

      const playlistsMap: Record<number, any> = {};

      for (const row of data) {
        if (!playlistsMap[row.id]) {
          playlistsMap[row.id] = {
            id: row.id,
            title: row.title,
            author: row.author,
            songs: [],
          };
        }

        playlistsMap[row.id].songs.push({
          id: row.song_id,
          title: row.song_title,
          artist: row.song_artist,
        });
      }

      return status(200, { playlists: Object.values(playlistsMap) });
    },
    {
      response: {
        200: t.Object(
          {
            playlists: t.Array(
              t.Object({
                id: t.Number({ description: "Identifiant unique de la playlist" }),
                title: t.String({ description: "Titre de la playlist" }),
                author: t.String({ description: "Auteur de la playlist" }),
                songs: t.Array(
                  t.Object({
                    id: t.Number({ description: "Identifiant unique de la chanson" }),
                    title: t.String({ description: "Titre de la chanson" }),
                    artist: t.String({ description: "Artiste de la chanson" }),
                  })
                ),
              })
            ),
          },
          { description: "OK" }
        ),
      },
      detail: {
        summary: "Recupère une liste de Playlists",
        description: "",
      },
    }
  )

  .listen(8080);
