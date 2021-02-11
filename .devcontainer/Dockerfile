FROM justfixnyc/tenants2_base:0.10

# This is needed to work around the following issue:
# https://github.com/microsoft/vscode-remote-release/issues/935
ENV NODE_ICU_DATA ""

# The following is taken from:
# https://code.visualstudio.com/docs/remote/containers-advanced#_creating-a-nonroot-user
#
# We want to do this so files created by VSCode (including files created by the user
# via VSCode's UI) have the same owner as the current user on the host system,
# rather than UID 0 (root).
#
# Note that we're setting the USER_UID to 1000 here, which is typically the UID of the
# first "real" non-root user on a system. This should work in the vast majority of cases
# but might not work for a few, which is a bummer. Sadly, there doesn't seem to be an
# easy way around this other than by editing this file.
ARG USERNAME=justfix
ARG USER_UID=1000
ARG USER_GID=$USER_UID

# Urg, it looks like Yarn has changed its public key since the last
# time we updated tenants2_base, so let's re-fetch its public key
# to make sure the next apt-get update works.
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -

# Create the user
RUN groupadd --gid $USER_GID $USERNAME \
    && useradd --uid $USER_UID --gid $USER_GID -m $USERNAME \
    #
    # [Optional] Add sudo support. Omit if you don't need to install software after connecting.
    && apt-get update \
    && apt-get install -y sudo \
    && echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME \
    && chmod 0440 /etc/sudoers.d/$USERNAME

# ********************************************************
# * Anything else you want to do like clean up goes here *
# ********************************************************

# [Optional] Set the default user. Omit if you want to keep the default as root.
USER $USERNAME
