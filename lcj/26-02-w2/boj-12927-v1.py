T = int(input()) # tc

def onoff_light(target):                    # 스위치 작동
    return "Y" if target in "N" else "N"


def switch(sw):                             # 전구 문자열을 입력받아서 켜고 끄며 반전시키기
    N = len(sw)                             # 전구 개수
    count = 0

    for i in range(N):                      # 모든 전구 (유의 : 0번 인덱스 == 1번 전구!)

        if sw[i] == "Y":                    # 스위치가 Y이면
            for j in range(i, N, i+1):      # i번 스위치의 제어 범위 : 배수 간격!! (ex. i = 2(3번 스위치) --> 5(6번), 8(9번), ...
                sw[j] = onoff_light(sw[j])  # 스위치 상태 반전

            count += 1                      # 스위치 작동 시마다 카운트 증가

    result = "".join(sw)                    # 모든 번호 전구를 이어붙임 (Y 파악 위해서)

    if "Y" in result:                       # 모든 스위치에 대해 돌고 난 이후에도 켜진 곳이 남아있다면
        return -1

    else: return count


for tc in range(1, T+1):

    sw = list(input().strip())
    result = switch(sw)

    print(f"#{tc} {result}")