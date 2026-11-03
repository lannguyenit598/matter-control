package config_test

// env adapts a map to the lookup function the loaders take.
func env(m map[string]string) func(string) (string, bool) {
	return func(k string) (string, bool) { v, ok := m[k]; return v, ok }
}
