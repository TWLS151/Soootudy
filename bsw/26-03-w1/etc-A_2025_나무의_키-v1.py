import sys
sys.stdin = open('나무의 키.txt')

T = int(input())
for tc in range(1, T + 1):
    N = int(input())
    arr = list(map(int, input().split()))
    max_val = max(arr)
    one_val = 0 
    two_val = 0  

    for h in arr:
        
        diff = max_val - h
        # 최대의 효율을 위해서 2씩 성장하는 날을 정하고
        # 나머지 날을 1에 박음
        two_val += diff // 2
        # 키가 2 자라는 횟수
        one_val += diff % 2
        # 키가 1 자라는 횟수
    while two_val > one_val + 1: # 2주는 횟수를 1주는 횟수로 쪼개기
        # 쪼개기
        # 번갈아서 물을 주기 때문에 쪼개면서 균형 맞추기
        two_val -= 1
        one_val += 2

    if one_val > two_val:
        # 1을 주는 날이 더 많은 경우(무조건 홀수로 끝남)
        # 어차피 다 주는 것이기 때문에
        time = one_val * 2 - 1 
        # 마지막 날은 하루만 걸리므로 1 빼기
        
    elif one_val == two_val:
        # 균형 맞추기
        time = one_val * 2
        # 마지막 날도 이틀 걸리므로 안 빼도 됨

    else: # two_val > one_val(two = one + 1):
        time = two_val * 2
        # 마지막 날은 기다려야 하니까 2의 횟수 * 2 
    print(f'#{tc} {time}')