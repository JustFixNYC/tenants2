from evictionfree.models import SubmittedHardshipDeclaration
from users.models import JustfixUser


def create_declaration(user: JustfixUser) -> SubmittedHardshipDeclaration:
    # TODO: Implement this.
    pass


def send_declaration(decl: SubmittedHardshipDeclaration):
    # TODO: Implement this.
    pass


def create_and_send_declaration(user: JustfixUser):
    """
    Create a SubmittedHardshipDeclaration model and send it.
    """

    decl = create_declaration(user)
    send_declaration(decl)
