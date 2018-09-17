def parse_secure_proxy_ssl_header(field):
    '''
    Parse an environment variable that specifies our
    secure proxy SSL header, e.g.:

        >>> parse_secure_proxy_ssl_header('X-Forwarded-Proto: https')
        ('HTTP_X_FORWARDED_PROTO', 'https')
    '''

    name, value = field.split(':')
    return ('HTTP_%s' % name.upper().replace('-', '_'), value.strip())
