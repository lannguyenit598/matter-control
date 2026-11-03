package productapi

import (
	"leonx.me/matter-control/internal/core/domain/matter"
)

// Review matrix wire shapes. Cell state is derived server-side: PENDING (no answer yet) or the
// recorded REVIEWED/ABSENT/UNABLE; `stale` means the question changed after that answer.

type reviewGridBody struct {
	ID            string `json:"id"`
	Name          string `json:"name"`
	Revision      int64  `json:"revision"`
	CreatedBy     string `json:"createdBy"`
	CreatedAt     string `json:"createdAt"`
	VersionCount  int    `json:"versionCount"`
	QuestionCount int    `json:"questionCount"`
}

type reviewVersionBody struct {
	VersionID    string `json:"versionId"`
	DocumentID   string `json:"documentId"`
	DocumentName string `json:"documentName"`
	Filename     string `json:"filename"`
	No           int    `json:"no"`
	Current      bool   `json:"current"`
}

type reviewQuestionBody struct {
	ID        string `json:"id"`
	Position  int    `json:"position"`
	Revision  int    `json:"revision"`
	Text      string `json:"text"`
	RevisedBy string `json:"revisedBy"`
	RevisedAt string `json:"revisedAt"`
}

type reviewAnswerBody struct {
	ID               string  `json:"id"`
	VersionID        string  `json:"versionId"`
	QuestionID       string  `json:"questionId"`
	QuestionRevision int     `json:"questionRevision"`
	State            string  `json:"state"`
	Text             string  `json:"text"`
	PageRef          string  `json:"pageRef"`
	QuoteRef         string  `json:"quoteRef"`
	Author           string  `json:"author"`
	AnsweredAt       string  `json:"answeredAt"`
	SupersedesID     *string `json:"supersedesId"`
}

type reviewCellBody struct {
	VersionID  string            `json:"versionId"`
	QuestionID string            `json:"questionId"`
	State      string            `json:"state"`
	Stale      bool              `json:"stale"`
	Answer     *reviewAnswerBody `json:"answer"`
}

type reviewGridViewBody struct {
	reviewGridBody
	Versions        []reviewVersionBody  `json:"versions"`
	Questions       []reviewQuestionBody `json:"questions"`
	QuestionHistory []reviewQuestionBody `json:"questionHistory"`
	Cells           []reviewCellBody     `json:"cells"`
}

func reviewGridDTO(g matter.ReviewGrid) reviewGridBody {
	return reviewGridBody{
		ID: g.ID, Name: g.Name, Revision: g.Revision, CreatedBy: g.CreatedBy.String(), CreatedAt: ts(g.CreatedAt),
		VersionCount: len(g.VersionIDs), QuestionCount: len(g.Questions),
	}
}

func reviewQuestionDTO(q matter.ReviewQuestion) reviewQuestionBody {
	return reviewQuestionBody{ID: q.ID, Position: q.Position, Revision: q.Revision, Text: q.Text, RevisedBy: q.RevisedBy.String(), RevisedAt: ts(q.RevisedAt)}
}

func reviewAnswerDTO(a matter.ReviewAnswer) reviewAnswerBody {
	var sup *string
	if a.SupersedesID != "" {
		s := a.SupersedesID
		sup = &s
	}
	return reviewAnswerBody{
		ID: a.ID, VersionID: a.VersionID, QuestionID: a.QuestionID, QuestionRevision: a.QuestionRevision, State: string(a.State),
		Text: a.Text, PageRef: a.PageRef, QuoteRef: a.QuoteRef, Author: a.Author.String(), AnsweredAt: ts(a.AnsweredAt), SupersedesID: sup,
	}
}

func reviewViewDTO(v matter.ReviewGridView) reviewGridViewBody {
	out := reviewGridViewBody{
		reviewGridBody:  reviewGridDTO(v.Grid),
		Versions:        make([]reviewVersionBody, len(v.Versions)),
		Questions:       make([]reviewQuestionBody, len(v.Grid.Questions)),
		QuestionHistory: make([]reviewQuestionBody, len(v.QuestionHistory)),
		Cells:           make([]reviewCellBody, len(v.Cells)),
	}
	for i, r := range v.Versions {
		out.Versions[i] = reviewVersionBody{VersionID: r.VersionID, DocumentID: r.DocumentID, DocumentName: r.DocumentName, Filename: r.Filename, No: r.No, Current: r.Current}
	}
	for i, q := range v.Grid.Questions {
		out.Questions[i] = reviewQuestionDTO(q)
	}
	for i, q := range v.QuestionHistory {
		out.QuestionHistory[i] = reviewQuestionDTO(q)
	}
	for i, c := range v.Cells {
		cell := reviewCellBody{VersionID: c.VersionID, QuestionID: c.QuestionID, State: "PENDING", Stale: c.Stale}
		if c.Answer != nil {
			a := reviewAnswerDTO(*c.Answer)
			cell.State, cell.Answer = a.State, &a
		}
		out.Cells[i] = cell
	}
	return out
}
