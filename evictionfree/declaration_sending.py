from evictionfree.models import SubmittedHardshipDeclaration
from users.models import JustfixUser
from . import hardship_declaration, cover_letter


def create_declaration(user: JustfixUser) -> SubmittedHardshipDeclaration:
    hd_vars = hardship_declaration.get_vars_for_user(user)
    assert hd_vars is not None
    cl_vars = cover_letter.get_vars_for_user(user)
    assert cl_vars is not None
    shd = SubmittedHardshipDeclaration(
        user=user,
        locale=user.locale,
        cover_letter_html=cover_letter.render_cover_letter_html(cl_vars),
        declaration_variables=hd_vars.dict(),
    )
    shd.full_clean()
    shd.save()
    return shd


def send_declaration(decl: SubmittedHardshipDeclaration):
    # TODO: Implement this.
    pass


def create_and_send_declaration(user: JustfixUser):
    """
    Create a SubmittedHardshipDeclaration model and send it.
    """

    decl = create_declaration(user)
    send_declaration(decl)
