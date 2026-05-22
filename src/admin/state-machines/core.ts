export type StateMachineAction<State extends string, Action extends string> = {
  from: State[];
  action: Action;
  to: State;
  permission?: string;
};

export function canTransition<State extends string, Action extends string>(
  current: State,
  action: Action,
  transitions: Array<StateMachineAction<State, Action>>,
) {
  return transitions.some((transition) => (
    transition.action === action && transition.from.includes(current)
  ));
}
