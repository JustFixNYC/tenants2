import { createStore, Store, applyMiddleware } from 'redux';

import { fetchSimpleQuery } from './queries/SimpleQuery';

type SimpleQueryState = {
  state: 'pending'
} | {
  state: 'ok'
  result: string
} | {
  state: 'error'
};

export type AppAction = {
  type: 'set-user';
  username: string|null;
} | {
  type: 'fetch-simple-query';
  thing: string;
} | {
  type: 'simple-query-ok';
  result: string;
} | {
  type: 'simple-query-error';
};

export interface AppState {
  simpleQuery?: SimpleQueryState;
  username: string|null;
}

const INITIAL_STATE: AppState = { username: null };

function reducer(state: AppState = INITIAL_STATE, action: AppAction): AppState {
  switch (action.type) {
    case 'set-user':
    return { ...state, username: action.username };

    case 'fetch-simple-query':
    return { ...state, simpleQuery: { state: 'pending' } };

    case 'simple-query-ok':
    return { ...state, simpleQuery: { state: 'ok', result: action.result } };

    case 'simple-query-error':
    return { ...state, simpleQuery: { state: 'error' } };
  }

  return state;
}

export type AppStore = Store<AppState, AppAction>;

type AppDispatch = (action: AppAction) => AppState;

const simpleQueryMiddleware = (store: AppStore) => (next: AppDispatch) => (action: AppAction): AppState => {
  if (action.type === 'fetch-simple-query') {
    fetchSimpleQuery({ thing: action.thing }).then(result => {
      store.dispatch({ type: 'simple-query-ok', result: result.hello });
    }).catch(e => {
      store.dispatch({ type: 'simple-query-error' });
    });
  }

  return next(action);
};

export function createAppStore(): AppStore {
  return createStore(
    reducer,

    // The type definitions for middleware in Redux are extremely
    // confusing so I'm just going to typecast here for the sake
    // of better type safety in the actual middleware.
    applyMiddleware(simpleQueryMiddleware as any)
  );
}
