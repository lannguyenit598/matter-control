# syntax=docker/dockerfile:1

# ---- build ----
FROM golang:1.26-alpine AS build
WORKDIR /src

# Download dependencies first to reuse cached layers.
COPY go.mod go.sum ./
RUN go mod download

COPY . .
ARG VERSION=dev
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w -X main.version=${VERSION}" -o /out/mcapi ./cmd/mcapi
# distroless has no shell: create the document object root here, owned by the runtime user.
RUN mkdir -p /out/data/objects && chown -R 65532:65532 /out/data

# ---- runtime ----
# distroless/static: no shell or package manager; runs as a non-root user.
FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/mcapi /mcapi
COPY --from=build --chown=65532:65532 /out/data /data
EXPOSE 8081
USER nonroot:nonroot
# `mcapi` serves the API, `mcapi migrate` applies the product migrations and exits.
ENTRYPOINT ["/mcapi"]
