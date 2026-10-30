package mattercontrol_test

import (
	"testing"

	"leonx.me/matter-control/internal/adapter/outbound/repotest/mattercontrol"
	"leonx.me/matter-control/internal/adapter/outbound/repotest/objectcontract"
	"leonx.me/matter-control/internal/core/domain/matter"
)

func TestContract_MemoryObjects(t *testing.T) {
	objectcontract.Run(t, func(t *testing.T) objectcontract.Subject {
		o := mattercontrol.NewMemoryObjects()
		return objectcontract.Subject{
			Store:  o,
			Damage: func(_ *testing.T, m matter.MatterID, sha string) { o.Damage(m, sha) },
			Remove: func(_ *testing.T, m matter.MatterID, sha string) { o.Remove(m, sha) },
		}
	})
}
