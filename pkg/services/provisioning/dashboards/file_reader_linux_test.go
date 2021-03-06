// +build linux

package dashboards

import (
	"path/filepath"
	"testing"

	"github.com/xformation/cms-ui/pkg/log"
)

var (
	symlinkedFolder = "testdata/test-dashboards/symlink"
)

func TestProvsionedSymlinkedFolder(t *testing.T) {
	cfg := &DashboardsAsConfig{
		Name:    "Default",
		Type:    "file",
		OrgId:   1,
		Folder:  "",
		Options: map[string]interface{}{"path": symlinkedFolder},
	}

	reader, err := NewDashboardFileReader(cfg, log.New("test-logger"))
	if err != nil {
		t.Error("expected err to be nil")
	}

	want, err := filepath.Abs(containingId)

	if err != nil {
		t.Errorf("expected err to be nil")
	}

	resolvedPath := reader.resolvePath(reader.Path)
	if resolvedPath != want {
		t.Errorf("got %s want %s", resolvedPath, want)
	}
}
