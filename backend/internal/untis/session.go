package untis

import (
	"context"
	"encoding/base64"
	"strconv"

	"github.com/crwntec/iris/backend/internal"
	"github.com/crwntec/iris/backend/internal/store"
)

// AuthenticatedSession bundles a ready-to-use Client with the user's UntisInfo
// and identity so callers don't have to carry them separately.
type AuthenticatedSession struct {
	Client   *Client
	Info     UntisInfo
	Username string
}

// AuthenticatedSessionFromStore reconstructs a session from Valkey.
// It accepts only the primitive values it needs so the untis package
// never has to import config, keeping the dependency graph acyclic.
func AuthenticatedSessionFromStore(
	ctx context.Context,
	st *store.Store,
	baseURL, schoolName, aesKey string,
	username string,
) (*AuthenticatedSession, error) {
	result, err := st.HGetAll(ctx, "user:"+username)
	if err != nil {
		return nil, err
	}

	decoded, err := base64.StdEncoding.DecodeString(result["password"])
	if err != nil {
		return nil, err
	}
	password, err := internal.DecryptAES(decoded, []byte(aesKey))
	if err != nil {
		return nil, err
	}

	client, err := ClientFromSession(
		Config{BaseURL: baseURL, SchoolName: schoolName},
		result["token"],
		result["sessionID"],
		result["schoolID"],
		username,
		string(password),
	)
	if err != nil {
		return nil, err
	}

	userID, _ := strconv.Atoi(result["userID"])
	return &AuthenticatedSession{
		Client:   client,
		Info:     UntisInfo{UserID: userID},
		Username: username,
	}, nil
}
