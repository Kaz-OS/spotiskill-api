import { openapi } from "@elysiajs/openapi";
import { SQL } from "bun";
import { Elysia, status, t } from "elysia";

const sqlite = new SQL("sqlite://src/data.db");

new Elysia({ prefix: "/api" })
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
  .post(
    "/signup",
    async ({ body }) => {
      if (!body.email || !body.first_name || !body.password || !body.confirm_password || !body.last_name) {
        return status(400, { message: "La requête est mal formulée" });
      }
      const data = await sqlite`
      INSERT INTO SingupRequest (email, password, first_name, last_name)
      VALUES (${body.email}, ${body.first_name}, ${body.password}, ${body.last_name})
    `;
      return status(201, { message: "Demande d'inscription ajoutée avec succès" });
    },
    {
      body: t.Object({
        email: t.String({ format: "email", description: "Adresse email de l'utilisateur" }),
        password: t.String({ format: "password", description: "Mot de passe de l'utilisateur" }),
        confirm_password: t.String({
          format: "password",
          description: "Confirmation du mot de passe de l'utilisateur",
        }),
        first_name: t.String({ description: "Prénom de l'utilisateur" }),
        last_name: t.String({ description: "Nom de famille de l'utilisateur" }),
      }),
      response: {
        201: t.Object(
          {
            message: t.String({ examples: ["Demande d'inscription ajoutée avec succès"] }),
          },
          { description: "Demande d'inscription ajoutée avec succès" }
        ),
        400: t.Object(
          {
            message: t.String({ examples: ["La requête est mal formulée"] }),
          },
          { description: "La requête est mal formulée" }
        ),
      },
      detail: {
        summary: "Crée une nouvelle demande d'inscription",
        description:
          "Crée une nouvelle demande d'inscription et l'ajoute à la base de données du service de streaming musical",
      },
    }
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

  .post(
    "/songs",
    async ({ body }) => {
      if (!body.album_id || !body.artist || !body.title) {
        return status(200, { message: "Chanson ajoutée avec succès" });
      }
      await sqlite`
        INSERT INTO Song (title, artist, album_id)
        VALUES (${body.title}, ${body.artist}, ${body.album_id})
      `;
      return status(201, { message: "La requete est mal formulé" });
    },
    {
      body: t.Object({
        title: t.String({ description: "Titre de la chanson" }),
        artist: t.String({ description: "Artiste de la chanson" }),
        album_id: t.Integer({ description: "Identifiant unique de l'album" }),
      }),
      response: {
        201: t.Object(
          {
            message: t.String({ examples: ["Chanson ajoutée avec succès"] }),
          },
          { description: "Chanson ajoutée avec succès" }
        ),
        400: t.Object(
          {
            message: t.String({ examples: ["La requete est mal formulé"] }),
          },
          { description: "La requete est mal formulé" }
        ),
      },
      detail: {
        summary: "Ajoute une nouvelle chanson",
        description: "Ajoute une nouvelle chanson à la bibliothèque de musique du service de streaming musical",
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

  .get(
    "/albums",
    async () => {
      const data = await sqlite`
        SELECT A.id, A.title, A.artist, A.release_date, S.id AS song_id, S.title AS song_title, S.artist AS song_artist
        FROM Album AS A
        INNER JOIN Song AS S ON A.id = S.album_id
        ORDER BY A.release_date
      `;

      const albumsMap: Record<number, any> = {};

      for (const row of data) {
        if (!albumsMap[row.id]) {
          albumsMap[row.id] = {
            id: row.id,
            title: row.title,
            artist: row.artist,
            release_date: row.release_date,
            songs: [],
          };
        }

        albumsMap[row.id].songs.push({
          id: row.song_id,
          title: row.song_title,
          artist: row.song_artist,
        });
      }

      return status(200, {
        albums: Object.values(albumsMap),
      });
    },
    {
      response: {
        200: t.Object(
          {
            albums: t.Array(
              t.Object({
                id: t.Number({ description: "Identifiant unique de l'album" }),
                title: t.String({ description: "Titre de l'album" }),
                artist: t.String({ description: "Nom de l'artiste qui a créé l'album" }),
                release_date: t.String({ format: "date", description: "Date de sortie de l'album" }),
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
          { description: "Liste des albums récupérés avec succès" }
        ),
      },
      detail: {
        summary: "Récupérer tous les albums",
        description: "Cette API permet de récupérer tous les albums disponibles dans le service de streaming musical",
      },
    }
  )

  .post(
    "/albums",
    async ({ body }) => {
      if (!body.title || !body.artist || !body.release_date) {
        return status(400, { message: "La requête est mal formulée" });
      }
      const data = await sqlite`
      INSERT INTO Album (title, artist, release_date)
      VALUES(${body.title}, ${body.artist}, ${body.release_date})
    `;
      return status(201, { message: "Album ajouté avec succès" });
    },
    {
      body: t.Object({
        title: t.String({ description: "Titre de l'album créer" }),
        artist: t.String({ description: "Nom de l'artiste qui a créer l'album" }),
        release_date: t.Date({ description: "Date de sortie de l'album" }),
      }),
      response: {
        400: t.Object(
          {
            message: t.String({ examples: ["La requête est mal formulée"] }),
          },
          { description: "La requete est mal formulé" }
        ),
        201: t.Object(
          {
            message: t.String({ examples: ["Album créé avec succès."] }),
          },
          { description: "Album ajouté avec succès" }
        ),
      },
    }
  )

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

  .get(
    "/stats",
    async () => {
      const data = await sqlite``;
      return status(200, { stats: data });
    },
    {
      query: t.Object({
        type: t.UnionEnum(["artists", "albums", "songs", "playing_time"], {
          description: "Type de statistique à récupérer.",
        }),
        user_id: t.Optional(
          t.Integer({
            description: "Identifiant de l'utilisateur dont les statistiques doivent être récupérées.",
          })
        ),
        from: t.Optional(
          t.String({
            description: "Date de début de la période sur laquelle récupérer les statistiques au format YYYY-MM-DD.",
          })
        ),
        to: t.Optional(
          t.String({
            description: "Date de fin de la période sur laquelle récupérer les statistiques au format YYYY-MM-DD.",
          })
        ),
      }),
      response: {
        200: t.Object(
          {
            stats: t.Object({
              albums: t.Optional(
                t.Array(
                  t.Object({
                    time: t.Integer({ examples: [3185] }),
                    title: t.String({ examples: ["Led Zeppelin IV"] }),
                    artist: t.String({ examples: ["Led Zeppelin"] }),
                  }),
                  {
                    description: "Liste des 3 albums les plus écoutés quand le type est albums.",
                  }
                )
              ),
              songs: t.Optional(
                t.Array(
                  t.Object({
                    time: t.Integer({ examples: [2275] }),
                    title: t.String({ examples: ["Black Dog"] }),
                    artist: t.String({ examples: ["Led Zeppelin"] }),
                  }),
                  {
                    description: "Liste des 3 morceaux les plus écoutés quand le type est songs.",
                  }
                )
              ),
              artists: t.Optional(
                t.Array(
                  t.Object({
                    time: t.Integer({ examples: [3185] }),
                    artist: t.String({ examples: ["Led Zeppelin"] }),
                  }),
                  {
                    description: "Liste des 3 artistes les plus écoutés quand le type est artists.",
                  }
                )
              ),
              playing: t.Optional(
                t.Integer({
                  description: "Temps d'écoute total quand le type est playing_time.",
                  examples: 5008,
                })
              ),
            }),
          },
          {
            description: "Statistiques récupérées avec succès.",
          }
        ),
      },
      400: t.Object(
        {
          message: t.String({ examples: "La requête est mal formulée" }),
        },
        {
          description: "La requête est mal formulée",
        }
      ),
      detail: {
        summary: "Récupérer des statistiques sur l'utilisation du service de streaming musical",
        description:
          "Cette API permet de récupérer des statistiques sur l'utilisation du service de streaming musical, telles que les genres musicaux préférés, le nombre de morceaux écoutés, le temps d'écoute total, le temps d'écoute par utilisateur, la musique la plus écoutée de l'année, du mois et de la semaine.",
      },
    }
  )
  .listen(8080);
