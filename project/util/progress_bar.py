def cli_progress_bar(
    iterable, prefix="", suffix="", decimals=1, length=100, fill="█", printEnd="\r"
):
    """
    Stolen from https://stackoverflow.com/questions/3173320/text-progress-bar-in-the-console.
    Usage: Call in a loop to create a terminal progress bar for a command line program.
    @params:
        iterable    - Required  : iterable object (Iterable)
        prefix      - Optional  : prefix string (Str)
        suffix      - Optional  : suffix string (Str)
        decimals    - Optional  : positive number of decimals in percent complete (Int)
        length      - Optional  : character length of bar (Int)
        fill        - Optional  : bar fill character (Str)
        printEnd    - Optional  : end character (e.g. "\r", "\r\n") (Str)
    """
    total = len(iterable)
    if total:
        # Progress Bar Printing Function
        def print_progress_bar(iteration):
            percent = ("{0:." + str(decimals) + "f}").format(100 * (iteration / float(total)))
            filledLength = int(length * iteration // total)
            bar = fill * filledLength + "-" * (length - filledLength)
            print(f"\r{prefix} |{bar}| {percent}% {suffix}", end=printEnd)

        # Initial Call
        print_progress_bar(0)
        # Update Progress Bar
        for i, item in enumerate(iterable):
            yield item
            print_progress_bar(i + 1)
        # Print New Line on Complete
        print()
