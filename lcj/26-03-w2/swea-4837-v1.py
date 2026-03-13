import sys
sys.stdin = open('input.txt', 'r')

T = int(input())

def find_subset(idx, length, sum):

    total = 0

    if length == N:     # 정해진 개수에 도달했다면
        return 1 if sum == goal else 0  # 검사 후 개수 추가

    for num in range(idx, 12):

        if sum + num_list[num] > goal:
            continue


        total += find_subset(num + 1, length + 1, sum + num_list[num])

    return total

for tc in range(1, T+1):

    N, goal = map(int, input().split())
    num_list = [i for i in range(1, 13)]

    result = find_subset(0, 0, 0)

    print(f"#{tc} {result}")