T = int(input())

for tc in range(1, T+1):
    N = int(input())
    portals = list(map(int, input().split()))
    answer = N-1 + (N-2)
    # 포탈 수 + 원래 이동해야 하는 수는 이미 정해져 있음으로 초기 값으로 설정
    
    # 포탈들을 쭉 돌면서, 이 포탈을 부득이하게 지나면서 추가로 이동해야 하는 횟수를 계산하여 더해줍니다.
    # 결국 이 자리까지 와야하기 때문에 (내 자리 값 - 이동하게 되는 위치 값)을 더해주었습니다.
    for i in range(1,N-1):
        answer = answer + (i+1 - (portals[i]))
    print(f'#{tc} {answer}')