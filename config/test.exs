use Mix.Config

# We don't run a server during test. If one is required,
# you can enable the server option below.
config :mtpo, MtpoWeb.Endpoint,
  http: [port: 4001],
  server: false

# Print only warnings and errors during test
config :logger, level: :warn

# Configure your database
config :mtpo, Mtpo.Repo,
  adapter: Ecto.Adapters.Postgres,
  username: "mtpo_test",
  password: "password",
  database: "mtpo_test",
  hostname: "localhost",
  pool: Ecto.Adapters.SQL.Sandbox

  config :mtpo,
    run_bot: false
