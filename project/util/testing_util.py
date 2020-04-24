def one_field_err(message: str, field: str = '__all__'):
    '''
    Returns a GraphQL form error validation response of a
    single error for a single field.
    '''

    return [{'field': field, 'messages': [message]}]
