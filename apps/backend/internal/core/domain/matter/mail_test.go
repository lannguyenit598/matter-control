package matter

import "testing"

// ParseMailDirection validates the wire value; empty defaults to inbound because a captured
// email is overwhelmingly a received one.
func TestParseMailDirection(t *testing.T) {
	cases := []struct {
		in      string
		want    MailDirection
		wantErr bool
	}{
		{"", MailInbound, false},
		{"INBOUND", MailInbound, false},
		{"OUTBOUND", MailOutbound, false},
		{"inbound", MailInbound, false},
		{"  outbound  ", MailOutbound, false},
		{"SIDEWAYS", "", true},
	}
	for _, tc := range cases {
		got, err := ParseMailDirection(tc.in)
		if tc.wantErr {
			if err == nil {
				t.Fatalf("%q: want error, got %q", tc.in, got)
			}
			continue
		}
		if err != nil || got != tc.want {
			t.Fatalf("%q: got %q err %v, want %q", tc.in, got, err, tc.want)
		}
	}
}
