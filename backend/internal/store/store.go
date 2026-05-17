package store

import (
	"context"
	"encoding/json"
	"time"

	"github.com/valkey-io/valkey-go"
)

type Store struct {
	client valkey.Client
}

func New(client valkey.Client) *Store {
	return &Store{client: client}
}

func (s *Store) Get(ctx context.Context, key string) (string, error) {
	return s.client.Do(ctx, s.client.B().Get().Key(key).Build()).ToString()
}

func (s *Store) Set(ctx context.Context, key string, value string, ttl time.Duration) error {
	cmd := s.client.B().Set().Key(key).Value(value)
	if ttl > 0 {
		return s.client.Do(ctx, cmd.Ex(ttl).Build()).Error()
	}
	return s.client.Do(ctx, cmd.Build()).Error()
}

func (s *Store) SetJSON(ctx context.Context, key string, v any, ttl time.Duration) error {
	data, err := json.Marshal(v)
	if err != nil {
		return err
	}
	return s.Set(ctx, key, string(data), ttl)
}

func (s *Store) GetJSON(ctx context.Context, key string, v any) error {
	str, err := s.Get(ctx, key)
	if err != nil {
		return err
	}
	return json.Unmarshal([]byte(str), v)
}

func (s *Store) Del(ctx context.Context, key string) error {
	return s.client.Do(ctx, s.client.B().Del().Key(key).Build()).Error()
}

func (s *Store) Keys(ctx context.Context, pattern string) ([]string, error) {
	return s.client.Do(ctx, s.client.B().Keys().Pattern(pattern).Build()).AsStrSlice()
}

func (s *Store) HGetAll(ctx context.Context, key string) (map[string]string, error) {
	return s.client.Do(ctx, s.client.B().Hgetall().Key(key).Build()).AsStrMap()
}

func (s *Store) HSet(ctx context.Context, key string, fields map[string]string) error {
	cmd := s.client.B().Hset().Key(key).FieldValue()
	for k, v := range fields {
		cmd = cmd.FieldValue(k, v)
	}
	return s.client.Do(ctx, cmd.Build()).Error()
}

func (s *Store) AppendChange(ctx context.Context, key string, value []byte, maxEntries int64) error {
	if err := s.client.Do(ctx, s.client.B().Lpush().Key(key).Element(string(value)).Build()).Error(); err != nil {
		return err
	}
	return s.client.Do(ctx, s.client.B().Ltrim().Key(key).Start(0).Stop(maxEntries-1).Build()).Error()
}

// GetChanges returns all entries in the list, newest first.
func (s *Store) GetChanges(ctx context.Context, key string) ([]string, error) {
	return s.client.Do(ctx, s.client.B().Lrange().Key(key).Start(0).Stop(-1).Build()).AsStrSlice()
}
