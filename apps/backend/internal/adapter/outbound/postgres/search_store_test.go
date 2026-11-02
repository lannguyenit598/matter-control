package postgres

import (
	"testing"

	"leonx.me/matter-control/internal/adapter/outbound/repotest/mattercontrol"
	"leonx.me/matter-control/internal/core/port"
)

func TestSearch_Postgres(t *testing.T) {
	mattercontrol.SuiteSearch(t, func(t *testing.T) mattercontrol.Bundle { b, _ := newProductStore(t); return b }, func(b mattercontrol.Bundle) port.SearchStore { return b.Store.(*faultCapableStore).inner })
}
