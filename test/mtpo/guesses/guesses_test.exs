defmodule Mtpo.GuessesTest do
  use Mtpo.DataCase

  alias Mtpo.Guesses
  alias Mtpo.Guesses.Guess
  alias Mtpo.Rounds
  alias Mtpo.Users

  describe "guess" do
    def default_changeset do
      round = Rounds.current_round!
      {:ok, user} = Users.create_or_get_user(%{name: "test_user"})
      %{
        "round_id" => round.id,
        "user_id" => user.id,
        "value" => "0:40.99"
      }
    end

    test "must be attached to a round" do
      {:ok, user} = Users.create_or_get_user(%{name: "test_user"})
      changeset = %{
        "round_id" => nil,
        "user_id" => user.id,
        "value" => "0:40.99"
      }
      {:error, _} = Guesses.create_guess(changeset)
    end

    test "must be attached to a user" do
      round = Rounds.current_round!
      changeset = %{
        "round_id" => round.id,
        "user_id" => nil,
        "value" => "0:40.99"
      }
      {:error, _} = Guesses.create_guess(changeset)
    end

    test "must have a valid value" do
      round = Rounds.current_round!
      {:ok, user} = Users.create_or_get_user(%{name: "test_user"})
      changeset = %{
        "round_id" => round.id,
        "user_id" => user.id,
        "value" => "0:40."
      }
      {:error, _} = Guesses.create_guess(changeset)
    end

    test "can be built" do
      {:ok, _} = Guesses.create_guess(default_changeset())
    end

    test "can report time in seconds" do
      {:ok, guess} = Guesses.create_guess(default_changeset())
      assert Guess.value_seconds(guess.value) == 40.99
    end

    test "requires its round is in progress" do
      changeset = default_changeset()
      {:ok, _} = Rounds.current_round!
      |> Rounds.update_round(%{"state" => "completed"})
      {:error, _} = Guesses.create_guess(changeset)
    end

    test "can only have one guess per user per round" do
      {:ok, _} = Guesses.create_guess(default_changeset())
      {:error, _} = Guesses.create_guess(default_changeset())
    end

    test "guess values must be unique per round" do
      {:ok, _} = Guesses.create_guess(default_changeset())
      round = Rounds.current_round!
      {:ok, user} = Users.create_or_get_user(%{name: "test_user_2"})
      changeset = %{
        "round_id" => round.id,
        "user_id" => user.id,
        "value" => "0:40.99"
      }
      {:error, _} = Guesses.create_guess(changeset)
    end

    test "check_time returns nil on malformed input" do
      :error = Guess.check_time("foo")
    end

    test "check_time expands input values without minutes" do
      {:ok, "0:40.99"} = Guess.check_time("40.99")
    end

    test "check_time passes through valid inputs" do
      {:ok, "0:40.99"} = Guess.check_time("0:40.99")
    end

    test "check_time reformats to standardized seperators" do
      {:ok, "0:45.82"} = Guess.check_time("0.45:82")
      {:ok, "0:45.82"} = Guess.check_time("45:82")
    end
  end
end
