# Houston Engine — standalone deployment image.
#
# Produces a minimal image that runs the `houston-engine` binary.
# Typical deployment: VPS (Houston Always On), behind a reverse proxy with TLS.
#
#   docker build -t houston/engine:dev -f always-on/Dockerfile .
#   docker run -p 7777:7777 \
#     -e HOUSTON_BIND_ALL=1 \
#     -e HOUSTON_BIND=0.0.0.0:7777 \
#     -e HOUSTON_ENGINE_TOKEN=<your-token> \
#     -v houston-home:/data/.houston \
#     -v houston-docs:/data/Houston \
#     houston/engine:dev

# ---------- Build stage ----------
FROM rust:1-slim-bookworm AS build
WORKDIR /src

RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config libssl-dev ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Cache the dependency compile by copying the manifests first.
COPY Cargo.toml Cargo.lock ./
COPY engine/ engine/

# Only build the engine server binary — excludes the desktop app crates.
RUN cargo build --release -p houston-engine-server --bin houston-engine

# ---------- Runtime stage ----------
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && useradd --system --create-home --home-dir /data houston

COPY --from=build /src/target/release/houston-engine /usr/local/bin/houston-engine

USER houston
WORKDIR /data
ENV HOUSTON_HOME=/data/.houston \
    HOUSTON_DOCS=/data/Houston \
    HOUSTON_BIND=0.0.0.0:7777 \
    HOUSTON_BIND_ALL=1

EXPOSE 7777
CMD ["/usr/local/bin/houston-engine"]
