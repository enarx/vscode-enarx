export let ENARX_TOML_EXAMPLE = `
# Configuration for a WASI application in an Enarx Keep

# Arguments
args = [
     "--argument1",
     "--argument2=foo"
]

# Environment variables
[env]
VAR1 = "var1"
VAR2 = "var2"

# Pre-opened file descriptors
[[files]]
kind = "null"

[[files]]
kind = "stdout"

[[files]]
kind = "stderr"

# A listen socket
[[files]]
name = "LISTEN"
kind = "listen"
prot = "tls" # or prot = "tcp"
port = 12345

# An outgoing connected socket
[[files]]
name = "CONNECT"
kind = "connect"
prot = "tcp" # or prot = "tls"
host = "127.0.0.1"
port = 23456`;