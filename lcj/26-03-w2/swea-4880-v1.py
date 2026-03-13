'''
그룹을 더이상 나눌 수 없을 때 -> 가위바위보 시작



'''

import sys
sys.stdin = open('input.txt', 'r')

T = int(input())

def rock_scissor_paper(p1, p2):

    idx1, card1 = p1[0]
    idx2, card2 = p2[0]

    if card1 == 1:

        if card2 == 2:
            return p2

        elif card2 == 3:
            return p1

        else:
            return p1

    elif card1 == 2:

        if card2 == 1:
            return p1

        elif card2 == 3:
            return p2

        else:
            return p1

    elif card1 == 3:

        if card2 == 1:
            return p2

        elif card2 == 2:
            return p1

        else:
            return p1

def tournament(arr):

    start = 1
    end = len(arr)

    if len(arr) == 1:
        return arr

    else:
        mid = (start + end) // 2
        left = arr[:mid]
        right = arr[mid:]

    left_winner = tournament(left)
    right_winner = tournament(right)

    return rock_scissor_paper(left_winner, right_winner)


for tc in range(1, T+1):

    N = int(input())
    players = list(map(int, input().split()))
    player_lst = []

    for player in enumerate(players, 1):
        player_lst.append(player)

    final_winner = tournament(player_lst)

    print(f"#{tc} {final_winner[0][0]}")
