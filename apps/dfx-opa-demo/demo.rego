package test

default Organisationsverwaltung = false
default Kundenverwaltung = false

# Mapping of tokens to allowed resources
permissions := {
    "ADMIN": {"Organisationsverwaltung", "Kundenverwaltung"},
    "MODERATOR": {"Kundenverwaltung"}
}

Organisationsverwaltung if {
    token := input.token
    permissions[token]["Organisationsverwaltung"]
}

Kundenverwaltung if {
    token := input.token
    permissions[token]["Kundenverwaltung"]
}
