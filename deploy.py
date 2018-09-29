import argparse
import sys


def deploy_local(args):
    print("TODO local")


def deploy_heroku(args):
    print("TODO heroku")


def main():
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(
        title='subcommands',
        description='valid subcommands',
    )
    parser_local = subparsers.add_parser(
        'local',
        help='Build container(s) and run everything locally.'
    )
    parser_local.set_defaults(func=deploy_local)

    parser_heroku = subparsers.add_parser(
        'heroku',
        help="Build container(s) and deploy to Heroku.",
    )
    parser_heroku.set_defaults(func=deploy_heroku)

    args = parser.parse_args()
    if not hasattr(args, 'func'):
        parser.print_help()
        sys.exit(1)

    args.func(args)


if __name__ == '__main__':
    main()
