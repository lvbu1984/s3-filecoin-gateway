package main

import (
	"log"
	"net/http"
	"os"

	"s3-filecoin-gateway/internal/s3ingress"
)

func main() {
	addr := os.Getenv("SFG_LISTEN")
	if addr == "" {
		addr = ":8080"
	}

	mux := http.NewServeMux()
	mux.Handle("/", s3ingress.NewHandler())

	server := &http.Server{
		Addr:    addr,
		Handler: mux,
	}

	log.Printf("SFG listening on %s\n", addr)
	if err := server.ListenAndServe(); err != nil {
		log.Fatal(err)
	}
}

