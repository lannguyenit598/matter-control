package mattercontrol_test

import (
	"testing"
	"time"

	"leonx.me/matter-control/internal/adapter/outbound/repotest/mattercontrol"
	"leonx.me/matter-control/internal/core/port"
)

func TestSearch_Memory(t *testing.T) {
	mattercontrol.SuiteSearch(t, func(t *testing.T) mattercontrol.Bundle {
		s := mattercontrol.NewMemoryStore(time.Now)
		return mattercontrol.Bundle{Store: s, World: mattercontrol.NewMemoryWorld(s)}
	}, func(b mattercontrol.Bundle) port.SearchStore { return b.Store.(port.SearchStore) })
}
