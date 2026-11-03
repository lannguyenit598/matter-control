package matter

import (
	"errors"
	"strings"
	"time"
)

// ErrTransitionForbidden reports a role that may not perform the requested transition
// (for example cancellation or reopen by a non-OWNER).
var ErrTransitionForbidden = errors.New("the caller's role does not permit this transition")

// TransitionRequest is one requested execution change on one work item.
type TransitionRequest struct {
	Item             WorkItem
	To               ExecutionState
	Role             MatterRole
	Reason           string
	WaitingPartyID   *PartyID
	WaitingCondition string
	CompletedAt      *time.Time
	AsOf             time.Time
}

// TransitionResult is the accepted outcome. NoOp is a same-state retry: no mutation and no
// event. Item carries the execution-related fields after the change; derived fields
// (dependency) are recomputed by the caller from the whole graph.
type TransitionResult struct {
	NoOp bool
	Item WorkItem
}

// DecideTransition applies the approved execution transition table (state-semantics.md).
// Every unlisted ordered pair is rejected with the allowed alternatives and no mutation.
func DecideTransition(req TransitionRequest) (TransitionResult, error) {
	it := req.Item
	from, to := it.Execution, req.To
	if !to.Valid() || !from.Valid() {
		return TransitionResult{}, &RejectedError{Code: "invalid-state", Message: "unknown execution state"}
	}
	if from == to {
		return TransitionResult{NoOp: true, Item: it}, nil
	}
	reason := strings.TrimSpace(req.Reason)
	needReason := func(msg string) error {
		if reason == "" {
			return &RejectedError{Code: "reason-required", Message: msg}
		}
		return nil
	}
	reject := func(code, msg string) error {
		return &RejectedError{Code: code, Message: msg, Alternatives: AllowedTransitions(from)}
	}
	ready := func() error {
		if it.Dependency != DependencyReady {
			return &RejectedError{
				Code: "dependency-blocked", Message: "prerequisites are not satisfied",
				Gates: it.DependencyReasons, Alternatives: AllowedTransitions(from),
			}
		}
		return nil
	}

	out := it
	switch {
	case from == ExecutionNotStarted && to == ExecutionInProgress,
		from == ExecutionWaiting && to == ExecutionInProgress:
		if err := ready(); err != nil {
			return TransitionResult{}, err
		}
		out = leaveWaiting(out)
		out.Execution = ExecutionInProgress

	case (from == ExecutionNotStarted || from == ExecutionInProgress) && to == ExecutionWaiting:
		if req.WaitingPartyID == nil || strings.TrimSpace(req.WaitingCondition) == "" {
			return TransitionResult{}, &RejectedError{Code: "waiting-details-required", Message: "a waiting party and condition are required"}
		}
		if it.OwnerActorID == nil {
			return TransitionResult{}, &RejectedError{Code: "waiting-owner-required", Message: "a responsible internal owner is required while waiting"}
		}
		out.Execution = ExecutionWaiting
		party, cond := *req.WaitingPartyID, strings.TrimSpace(req.WaitingCondition)
		out.WaitingPartyID, out.WaitingCondition = &party, &cond

	case to == ExecutionCompleted && (from == ExecutionNotStarted || from == ExecutionInProgress || from == ExecutionWaiting):
		if err := ready(); err != nil {
			return TransitionResult{}, err
		}
		if from != ExecutionInProgress {
			// Recording already-performed work, or resolving a wait, needs its reason.
			if err := needReason("a reason is required to complete from " + string(from)); err != nil {
				return TransitionResult{}, err
			}
		}
		at := req.AsOf
		if req.CompletedAt != nil {
			at = *req.CompletedAt
		} else if from == ExecutionNotStarted {
			return TransitionResult{}, &RejectedError{Code: "completion-time-required", Message: "the completion time of already-performed work is required"}
		}
		if at.After(req.AsOf) {
			return TransitionResult{}, &RejectedError{Code: "completion-in-future", Message: "the completion time cannot be after the recorded time"}
		}
		out = leaveWaiting(out)
		out.Execution = ExecutionCompleted
		out.CompletedAt = &at
		// No automatic verification: completed is not verified (RULE-002).

	case to == ExecutionCancelled && (from == ExecutionNotStarted || from == ExecutionInProgress || from == ExecutionWaiting):
		if req.Role != MatterRoleOwner {
			return TransitionResult{}, ErrTransitionForbidden
		}
		if err := needReason("an explicit reason is required to cancel"); err != nil {
			return TransitionResult{}, err
		}
		out = leaveWaiting(out)
		out.Execution = ExecutionCancelled
		at := req.AsOf
		out.CancelledAt = &at

	case (from == ExecutionCompleted || from == ExecutionCancelled) && to == ExecutionInProgress:
		if req.Role != MatterRoleOwner {
			return TransitionResult{}, ErrTransitionForbidden
		}
		if err := needReason("a reason is required to reopen"); err != nil {
			return TransitionResult{}, err
		}
		out.Execution = ExecutionInProgress
		out.CompletedAt, out.CancelledAt = nil, nil
		if out.ProofRequired && out.Applicability != VerificationNotApplicable {
			out.Verification = VerificationUnverified
			out.ProofEpoch++
			at := req.AsOf
			out.ProofEpochOpenedAt = &at
		}

	default:
		return TransitionResult{}, reject("transition-not-allowed", "this execution change is not allowed from "+string(from))
	}
	return TransitionResult{Item: out}, nil
}

func leaveWaiting(it WorkItem) WorkItem {
	it.WaitingPartyID, it.WaitingCondition = nil, nil
	return it
}

// AllowedTransitions lists the execution states reachable from s by some actor under some
// guard; it is what a rejection offers as alternatives.
func AllowedTransitions(s ExecutionState) []ExecutionState {
	switch s {
	case ExecutionNotStarted:
		return []ExecutionState{ExecutionInProgress, ExecutionWaiting, ExecutionCompleted, ExecutionCancelled}
	case ExecutionInProgress:
		return []ExecutionState{ExecutionWaiting, ExecutionCompleted, ExecutionCancelled}
	case ExecutionWaiting:
		return []ExecutionState{ExecutionInProgress, ExecutionCompleted, ExecutionCancelled}
	case ExecutionCompleted, ExecutionCancelled:
		return []ExecutionState{ExecutionInProgress}
	}
	return nil
}
