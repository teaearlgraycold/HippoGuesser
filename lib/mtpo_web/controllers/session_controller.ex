defmodule MtpoWeb.SessionController do
  use MtpoWeb, :controller

  action_fallback MtpoWeb.FallbackController

  def auth(conn, _params) do
    state = SecureRandom.urlsafe_base64(16)
    conn = put_session(conn, :state, state)
    redirect(conn, external: Twitch.authorize_url!(state))
  end

  def callback(conn, %{"state" => state, "code" => code}) do
    if get_session(conn, :state) == state do
      token = Twitch.get_token!(code)
      username = Twitch.get_username(token["access_token"])
      conn = conn
      |> put_session(:auth_token, token["access_token"])
      |> put_session(:username, username)
      |> put_resp_cookie("username", username, max_age: token["expires_in"], http_only: false)
      |> put_resp_header("Access-Control-Allow-Credentials", "true")
      redirect(conn, to: "/")
    else
      redirect(conn, to: "/")
    end
  end

  def delete(conn, _params) do
    conn = conn
    |> delete_session(:auth_token)
    |> delete_session(:username)
    |> delete_resp_cookie("username")
    redirect(conn, to: "/")
  end
end
